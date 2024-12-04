import { Scraper } from 'agent-twitter-client';
import { readFileSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function main() {



  const login = async () => {
    const username = process.env.TWITTER_USERNAME!;
    const password = process.env.TWITTER_PASSWORD!;

    const scraper = new Scraper();
    try {
      const cookies = readFileSync('cookies.json', 'utf8');
      if (cookies) {
        const parsedCookies = JSON.parse(cookies).map((cookie: any) =>
          `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`
        );
        await scraper.setCookies(parsedCookies);
        console.log('Cookies loaded from file');
      }
    } catch (error) {
      console.error('Error setting cookies:', error);
      await scraper.login(username, password);

      const newCookies = await scraper.getCookies();
      writeFileSync('cookies.json', JSON.stringify(newCookies, null, 2));
      console.log('Cookies saved to file');
    }

    console.log('Logged in successfully:', await scraper.isLoggedIn());
    return scraper;

  }

  const scraper = await login();

  // Get a user's tweets
  const tweets = await scraper.fetchHomeTimeline(10, []);
  console.log('tweets', tweets);
}

main();