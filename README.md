# Overwolf generator

> Yeoman generator for Basic Overwolf App - lets you quickly set up a project and windows.

This generator is in an early development. 
Contributions and discussions about project-structure and features are welcome.

Unit-Tests will be provided as soon as I have the time to figure out how to create them for yeoman 
or someone contributes some to build upon on.

## Requirements

You need [nodeJS](https://nodejs.org/en/) to use yeoman generators.

Next install yo
``` npm install -g yo ```

And you're good to go for now (grunt / bower integration might follow)

## Usage
For step-by-step instructions on using Yeoman (with an angularJS generator) see [this tutorial.](http://yeoman.io/codelab/)

Make a new directory, and `cd` into it:
```
mkdir my-new-project && cd $_
```

Run `yo overwolf` and follow the prompts:
```
yo overwolf
```

## Generators

Available generators:

* [overwolf](#app) (aka [overwolf:app](#app))
* [overwolf:window](#window)

### App
initializes your app with a manifest.json and Start window (using [overwolf:window](#window))
```
yo overwolf
```

### Window
creates a new window with its own html, js and css file
```
yo overwolf:window name
```
