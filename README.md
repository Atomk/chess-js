chess-js
=======

The chess game everyone knows and loves, in vanilla JavaScript. [Try it out!](https://atomk.github.io/chess-js/)

The icons used for the pieces are just [Unicode characters](https://en.wikipedia.org/wiki/Chess_symbols_in_Unicode), they may look different depending on your device/browser.

| Windows 10 (Chrome) | Samsung |
| --- | --- |
| ![Screenshot on Windows 10](./images/screenshot_win10_chrome.png) | ![Screenshot on Samsung](./images/screenshot_android_chrome.png) |

Doesn't work on Internet Explorer because it doesn't support arrow functions.

## Features
- Basic AI
- Basic pawn promotion (always promoted to queens)
- Support for some chess variants (6x6, 5x5)

## To-do
- Button to restart game on gameover (stalemate, checkmate), with same settings
- Start game without menu, let user open the menu during play
- Move all non-graphic functions into a class
- Allow different chessboard sizes
- SVG icons for more consistency across browsers
- https://en.wikipedia.org/wiki/Promotion_(chess)
- https://en.wikipedia.org/wiki/Castling
- https://en.wikipedia.org/wiki/En_passant
- Allow user to choose its color (now it's white by default)
- Make Ai wait a moment before doing its move
- Undo
- Timer
- Tests!
- Simple NodeJS PvP server