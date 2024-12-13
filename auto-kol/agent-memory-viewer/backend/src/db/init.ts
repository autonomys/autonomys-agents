import pkg from 'pg';
const { Pool } = pkg;

import { config } from '../config/index.js';
import * as fs from 'fs/promises';

const parseConnectionString = (url: string) => {
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\//;
    const match = url.match(regex);
    if (!match) throw new Error('Invalid connection string');
    const [_, user, password, host, port] = match;
    return { user, password, host, port };
};

const { user, password, host, port } = parseConnectionString(config.DATABASE_URL || '');

const initPool = new Pool({
    user,
    password,
    host,
    port: parseInt(port),
    database: 'postgres'
});

const schemaPath = new URL('./schema.sql', import.meta.url).pathname;

async function initializeDatabase() {
    try {
        await initPool.query(`
            CREATE DATABASE agent_memory;
        `);
        console.log('Database created successfully');
    } catch (error: any) {
        if (error.code === '42P04') {
            console.log('Database already exists, continuing...');
        } else {
            console.error('Error creating database:', error);
            throw error;
        }
    } finally {
        await initPool.end();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
}

async function initializeTables() {
    const dbPool = new Pool({
        user,
        password,
        host,
        port: parseInt(port),
        database: 'agent_memory'
    });
    
    try {
        const schema = await fs.readFile(schemaPath, 'utf8');
        await dbPool.query(schema);
        console.log('Tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        await dbPool.end();
    }
}

export async function initialize() {
    await initializeDatabase();
    await initializeTables();
}

export async function resetDatabase() {
    const initPool = new Pool({
        user,
        password,
        host,
        port: parseInt(port),
        database: 'postgres'
    });

    try {
        await initPool.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = 'agent_memory'
            AND pid <> pg_backend_pid();
        `);

        await initPool.query('DROP DATABASE IF EXISTS agent_memory;');
        await initPool.query('CREATE DATABASE agent_memory;');
        console.log('Database reset successfully');

        await new Promise(resolve => setTimeout(resolve, 1000));

        const dbPool = new Pool({
            user,
            password,
            host,
            port: parseInt(port),
            database: 'agent_memory'
        });

        try {
            const schema = await fs.readFile(schemaPath, 'utf8');
            await dbPool.query(schema);
            console.log('Tables recreated successfully');
        } finally {
            await dbPool.end();
        }

    } catch (error) {
        console.error('Error resetting database:', error);
        throw error;
    } finally {
        await initPool.end();
    }
}
