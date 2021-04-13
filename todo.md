# TODO

- Write up documentation
- finish state tests
- finish effects tests
- continue work on the redux

## Bugs
- a nested component eating it's aprent
-

-----------

on mount
	if type==data && attr == 'content' && nodeName == slot
		replace with textNode

on unmount
	if type==data && attr == 'content' && nodeName == textNode
		replace with slot