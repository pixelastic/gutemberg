# Sherlock Search

Search into the whole Sherlock Holmes book collection using Algolia.

[http://pixelastic.github.io/sherlock-search/](http://pixelastic.github.io/sherlock-search/)

## Why?

I work and Algolia, and since I've joined I've been amazed by the power of the
service and its flexibility. I wanted to see if Algolia was a good fit for
indexing and searching in huge amount of textual data.

So I started building a first version of this demo in two hours, indexing [A
Tale of Two Cities][1] from the [Gutenberg Project][2]. The results were
satisfying, so I started working on a more complete search demo.

## How does it work?

I used the HTML version of the Sherlock Holmes books from the [Gutenberg
Project][3] as input, parsed it, and
pushed the records to Algolia.

The parsing basically involves creating one record for each `<p>` paragraph of
text from the source book. I also added the name of the book and parent chapter
to each record. The chapter name is usually found in the closest previous `<h2>`
or `<h3>` element.

I also added the `bookOrder`, `chapterOrder` and `order` fields to each record
that respectively indicate the publishing order or each book, the chapter number
inside the book and the ascending order of each paragraph inside a chapter. With
those values, I can display results in the natural reading order.

Some paragraphs contained too many lines of text that were badly influencing the
relevance as well as making the display ugly. I split those records into several
smaller ones, with a maximum length of 300 characters, while still making sure
I wasn't cutting any sentence in half.

To improve the display a bit more, I decided to add more context to the element
displayed. That is the paragraph of text before and after the matching record
are also displayed, but toned down. I went a bit further and even merged several
results together before displaying them if they were following each other, to
avoid duplicating context.

```json
{
  "author": "Sir Arthur Conan Doyle",
  "book": "MEMOIRS OF SHERLOCK HOLMES",
  "bookOrder": 4,
  "chapterName": "Adventure XI. The Final Problem",
  "chapterOrder": 11,
  "content": "Of these the first and second were extremely condensed, while the last is, as I shall now show, an absolute perversion of the facts. It lies with me to tell for the first time what really took place between Professor Moriarty and Mr. Sherlock Holmes.",
  "context": {
    "next": {
      "content": "It may be remembered that after my marriage, and my subsequent start in private practice, the very intimate relations which had existed between Holmes and myself became to some extent modified. He still came to me from time to time when he desired a companion in his investigation, but these occasions grew more and more seldom, until I find that in the year 1890 there were only three cases of which I retain any record.",
      "objectID": "8eae8d862b3cfefea7a21d575fe8f91b"
    },
    "previous": {
      "content": "I alone know the absolute truth of the matter, and I am satisfied that the time has come when no good purpose is to be served by its suppression. As far as I know, there have been only three accounts in the public press: that in the Journal de Geneve on May 6th, 1891, the Reuter's despatch in the English papers on May 7th, and finally the recent letter to which I have alluded.",
      "objectID": "ea5b537d24f3756a2959c05f569aab37"
    }
  },
  "objectID": "64776a27d82c597baffb365bf0ee8098",
  "order": 4,
  "tagName": "P"
}
```

Overall it represents a little more than 15.000 records, which is a [Hacker
plan][4] and a half. Not that bad for the whole Sherlock Holmes bibliography.

The UI was easily achieved thanks to our
[instantsearch.js](https://community.algolia.com/instantsearch.js/) JavaScript
library.

## Challenges

The data I got from the Gutenberg project did not follow any convention. Each of
the 7 indexed books had their own slightly different markup. I had to write
7 slightly different scripts to extract the data.

Oh and the last Sherlock Holmes book, [The Casebook of Sherlock Holmes][5], is
not yet elevated to public domain, so I could not index it.

## Dev

Start by doing an `npm install` then:

Run `npm run build` to parse all the books in `./books` and extract records in
`./records`.

Run `npm run push` to push the data to the Algolia index (will need
`ALGOLIA_API_KEY` env variable).

Run `npm run serve` to serve a local version on `http://localhost:4001`.

You can run `npm run test` and `npm run test:watch` to run the tests, but there
are very few of them.

Finally, `npm run deploy` will build the website in `./public`, commit it to
`gh-pages` and push it.

## TODO

- Order books by publishing dates
- Remove the capitalization on titles
- Display the chapters only if a book is selected
- Order chapters by order
- Make the sidebar larger
- Add an icon for each book

- Use a serif font on the hits https://www.google.com/fonts/specimen/Lora
- Use a background that looks like a paper
  http://www.photos-public-domain.com/wp-content/uploads/2012/05/ivory-off-white-paper-texture.jpg
- Use a funky highlight http://codepen.io/pixelephant/pen/ghtfF
- Use a nice and funky font on the chapter/book in the hits
- Add a small avatar of the books
- Add a ligature separator between blocks
  https://commons.wikimedia.org/wiki/File:->Flourisch_01->.svg

- Add a leather header?
- Opened book effect between sidebar and hits

[1]: https://www.gutenberg.org/files/98/98-h/98-h.htm
[2]: http://www.gutenberg.org/
[3]: http://www.gutenberg.org/ebooks/subject/76
[4]: https://www.algolia.com/users/sign_up/hacker
[5]: https://en.wikipedia.org/wiki/The_Case-Book_of_Sherlock_Holmes
