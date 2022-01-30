import fetch from 'node-fetch';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import Parser from 'rss-parser';
import path from 'path';

const config = {
  plexAnimeDirectory: 'D:\\Media\\Anime',
  animeRegex: '^\\[(Erai-raws|SubsPlease)\\] (.+) - ((\\d{2,})(v\\d)?) .*1080p.*\\.mkv$',
  torrentSaveDirectory: 'D:\\Downloads\\Torrents\\download'
};

const downloadTorrent = async ({ title, link }) => {
  const downloadPath = path.resolve(config.torrentSaveDirectory, `${title}.torrent`);
  const torrentResp = await fetch(link);
  const fileStream = createWriteStream(downloadPath);
  torrentResp.body.pipe(fileStream);
};

(async () => {
  const resp = await fetch('https://nyaa.si/?page=rss&q=1080p+SubsPlease&c=1_2&f=0');
  const rssText = await resp.text();
  await fs.writeFile('./rss.txt', rssText);
  const lastCheckedTitle = (await fs.readFile('./lastCheckedTitle.txt')).toString();
  // const rssText = await fs.readFile('./lastRss.txt');

  const parser = new Parser();
  const feed = await parser.parseString(rssText);
  await fs.writeFile('./lastRss.json', JSON.stringify(feed, null, 2));
  const currentAnimeFolders = await fs.readdir(config.plexAnimeDirectory);

  for (const item of feed.items) {
    const { title, link } = item;
    if (title === lastCheckedTitle) {
      break;
    }
    const regexMatch = title.match(new RegExp(config.animeRegex));
    if (regexMatch) {
      const [,, animeName, episodeNumber] = regexMatch;
      if (episodeNumber === '01') {
        await downloadTorrent({ link, title });
      } else if (currentAnimeFolders.includes(animeName)) {
        await downloadTorrent({ link, title });
      }
    } else {
      fs.appendFile('failedRegex.txt', title + '\r\n');
    }
  }

  await fs.writeFile('./lastCheckedTitle.txt', feed.items[0].title);
})();
