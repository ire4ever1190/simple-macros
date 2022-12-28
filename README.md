# Simple macros

Adds in LaTeX like text replacement macros. Very basic at the moment since its a rushed job but I'll clean it up later

Just install plugin manually. Go to settings and then add in key -> replacement that you want.
Arguments can be used in replacement which are numbered by their index (e.g. $0, $1)

Example is 
	- Key field `elem`
	- Value field `[\<$0\>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/$0)`

Then in your markdown file you can do `elem{div}` and it will create a link to MDN for the div element
