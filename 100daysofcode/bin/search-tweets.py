"""
Searches Twitter for tweets matching a query.

Returns only Tweets coded in English.
"""
import os
import json
import tweepy
import logging
import argparse
from typing import Any, List
from datetime import datetime


LOG = logging.getLogger(__name__)

parser = argparse.ArgumentParser(description="""
    Search Twitter for Tweets. Returns the most popular Tweets coded in English.""")
parser.add_argument('-q',
    metavar='<query>',
    type=str,
    required=False,
    help='a query phrase to send to Twitter\'s Search API.')
parser.add_argument('-u',
    metavar='<user id or screen name>',
    type=str,
    required=False,
    help='a Twitter user ID or timeline from which to source Tweets.')
parser.add_argument('-d',
    metavar='<date>',
    type=str,
    required=False,
    default=str(datetime.now().date()),
    help='the last date from which to pull Tweets in YYYY-MM-DD format. Defaults to today\'s date.')
parser.add_argument('-n',
    metavar='<number of tweets>',
    type=int,
    required=False,
    default=1000,
    help='the number of tweets to pull. Defaults to 1,000.')
args = parser.parse_args()


if __name__ == '__main__':
    auth = tweepy.OAuthHandler(os.environ['TWITTER_CONSUMER_KEY'],
        os.environ['TWITTER_CONSUMER_SECRET'])
    auth.set_access_token(os.environ['TWITTER_ACCESS_TOKEN'],
        os.environ['TWITTER_ACCESS_SECRET'])

    api = tweepy.API(auth, wait_on_rate_limit=True,
        wait_on_rate_limit_notify=True,
        compression=True)

    if args.q:
        tweets = tweepy.Cursor(api.search, q=args.q, result_type='mixed', until=args.d,
            tweet_mode='extended',
            ).items(args.n)

    elif args.u:
        tweets = tweepy.Cursor(api.user_timeline, id=args.u, result_type='mixed', until=args.d,
            tweet_mode='extended',
            ).items(args.n)

    else:
        raise Exception("A query or user ID is required.")

    for tweet in tweets:
        details = tweet._json

        print(json.dumps(details))
