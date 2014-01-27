oils-js-quickstart
==================

### Oils JS

Oils is a simple framework to create Openshift Node JS Applications. You can also use this for non Openshift projects as the variable dependencies are just very few and it will work even if it's not in an Openshift environment.

It will automatically read models and controllers. Also features automatic routing for created controllers.

Directory Structure:

    |-- controllers
    |-- models
    |-- views
    |-- public
    |-- lib

### Set-Up

For OpenShift apps, after creating your node js + mongodb application, clone the project to your local and go to that directory. In the command line, do the ff:

```
git remote add upstream -m master https://github.com/mannyvergel/oils-js-quickstart.git
```

```
git pull -s recursive -X theirs upstream master
```

```
git push
```

or you can just simply Download the zip version of this project and copy-paste it to your node js application.

### Usage

This sample app is self explanatory. Just browse through the directories and files and you will get the hang of it.

It uses Mongoose for ORM. Mongo DB for the database. Swig for templating.

### Contact

If you have questions, feel free to drop me an email: manny@mvergel.com

### License

MIT
