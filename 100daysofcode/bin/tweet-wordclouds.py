import os
import re
import glob
import json
import collections
import logging
import argparse
import imageio
import string
import numpy as np
import matplotlib.pyplot as plt
from os import path
from collections import Counter
from typing import Any, List, Dict, Optional
from wordcloud import WordCloud, ImageColorGenerator, STOPWORDS


LOG = logging.getLogger(__name__)

stopwords = set(STOPWORDS)
# stopwords.add('i')
# stopwords.add('im')
# stopwords.add('rt')
# stopwords.add('&amp;')
# stopwords.add('will')
# stopwords.add('know')
# stopwords.add('really')
# stopwords.add('for')
# stopwords.add('said')
# stopwords.add('say')
# stopwords.add('us')
# stopwords.add('need')
# stopwords.add('make')
# stopwords.add('must')
# stopwords.add('people')
# stopwords.add('thank')
# stopwords.add('thanks')
# stopwords.add('one')
# stopwords.add('w')
# stopwords.add('big')
# stopwords.add('go')
# stopwords.add('got')
# stopwords.add('lets')
# stopwords.add('good')
# stopwords.add('now')
# stopwords.add('great')
# stopwords.add('new')
# stopwords.add('made')
# stopwords.add('going')
# stopwords.add('yet')
# stopwords.add('never')
# stopwords.add('time')
# stopwords.add('many')
# stopwords.add('every')
# stopwords.add('much')
# stopwords.add('thats')
# stopwords.add('lot')
# stopwords.add('next')
# stopwords.add('see')
# stopwords.add('youre')
# stopwords.add('ill')

printable = set(string.printable)

def remove_links(w: str) -> bool:
    return not w.startswith(('http'))

def remove_stopwords(w: str) -> bool:
    # Remove single string, non-digit words
    if len(w) == 1 and not w.isdigit():
        return False

    return (bool(w) and w not in stopwords)


def make_image(text: str, mask_name: str, title: str, background_color: str, output_dir: str):
    image_mask = imageio.imread(mask_name, as_gray=False, pilmode="RGB")
    image_colors = ImageColorGenerator(image_mask)

    wc = WordCloud(background_color=background_color,
        max_words=500,
        height=1600,
        width=3200,
        repeat=False,
        mask=image_mask,
        scale=10,
        min_word_length=2,
        stopwords=stopwords)
    wc.generate_from_frequencies(text)

    plt.imshow(wc.recolor(color_func=image_colors),
        interpolation="bilinear")

    plt.axis("off")
    plt.title(f'Most common words tweeted with #{title}',
        pad=15,
        fontdict={
            'fontsize': 'x-large',
            'fontfamily': 'monospace',
        })

    plt.savefig(f'{output_dir}/{title}-tweet-text.png')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="""
        Create wordmaps from Tweets in the shape and color of a given mask.""")
    parser.add_argument('--filename',
        metavar='<filename.ndjson>',
        type=str,
        required=True,
        help='the file of newline-delimited Tweets to analyze.')
    parser.add_argument('--mask',
        metavar='<mask>',
        type=str,
        required=True,
        help='an image file (PNG or JPEG) used to mask the output data viz.')
    parser.add_argument('--background-color',
        metavar='<background color>',
        type=str,
        default='white',
        help='the background color of the generated word cloud. Defaults to white')
    parser.add_argument('--output-dir',
        metavar='<output directory>',
        type=str,
        required=True,
        help='the output directory of the wordclouds')
    args = parser.parse_args()

    filename = args.filename

    title = re.search(r'.*data/(.*)-[0-9]{4}-[0-9]{2}-[0-9]{2}.ndjson$',
        filename)[1]

    with open(filename, "r") as f:
        all_hashtags = []

        for line_number, line in enumerate(f):
            tweet = json.loads(line)

            if tweet.get('retweeted_status'):
                continue

            tweet_text = tweet['full_text'].lower().replace('\n', ' ')
            # Filter out low quality spam posts
            if '#verydice' in tweet_text:
                continue

            printable_words = ''.join(filter(lambda x: x in printable,
                tweet_text)).split(' ')

            stripped_words = [ w.replace('&amp;', '').strip('[".:!?-,+/()*|]') for w in printable_words ]
            words_without_links = filter(remove_links, stripped_words)
            filtered_words = filter(remove_stopwords, words_without_links)
            all_hashtags += list(filtered_words)

        counter = Counter(all_hashtags)

        stats = {
            'hashtag_frequences': counter,
            'top_50_words': counter.most_common(50)
        }

        if not dict(counter):
            pass

        make_image(dict(counter), args.mask, title, args.background_color, args.output_dir)

        print(json.dumps(stats))
