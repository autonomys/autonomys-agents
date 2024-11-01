#!/bin/bash

sqlite3 thread-storage.sqlite "SELECT json_group_array(json_object(
    'thread_id', thread_id,
    'messages', messages,
    'tool_calls', tool_calls,
    'created_at', created_at,
    'updated_at', updated_at
)) FROM threads;" | jq '.' > threads.json