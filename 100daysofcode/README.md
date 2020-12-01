# Tweet wordlcouds

## Requirements
* python3.6+
* wordcloud >= 1.8.1
* tweepy >= 3.8.0


## To run
Required environment variables (get yours from [Twitter Developer API](https://developer.twitter.com)):
* `TWITTER_CONSUMER_KEY`
* `TWITTER_CONSUMER_SECRET`
* `TWITTER_ACCESS_TOKEN`
* `TWITTER_ACCESS_SECRET`

To download tweets:
```sh
python ./bin/search-tweets.py -q '#100DaysOfCode' -n 10000 > data/100daysofcode.ndjson
```
Note you need to redirect the output of this script from stdout to a new file.

To create word clouds:
```sh
python ./bin/tweet-wordclouds.py --filename data/100daysofcode.ndjson --mask masks/earth.png --output-dir wordclouds > data/stats.json
```

## Attributions
Earth drawing PNG courtesy of http://clipart-library.com/free/earth-drawing-png.html.
