{
    "appDir": "../www",
    "baseUrl": "js",
    "dir": "../www-build",
    //Comment out the optimize line if you want
    //the code minified by UglifyJS
    //"optimize": "none",
    optimize: "closure",

    // point to the shim config we set up before
    "mainConfigFile": "../www/js/main.js",

    "modules": [
        //Optimize the application files. jQuery and the plugins will be included
        //automatically, as they are dependencies of app.js.
        {
            "name": "app"
        }
    ]
}
