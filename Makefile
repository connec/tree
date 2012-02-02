build:
	squash --coffee --file lib/tree.js --relax ./src/tree=Tree

watch:
	squash --coffee --file lib/tree.js --relax --watch ./src/tree=Tree

.PHONY: build watch