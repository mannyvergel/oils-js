LIBRARY FOLDER
========================

Just a convention to organize your javascript files. Put your custom js files here. You are free to rename or delete this folder if not needed.

There's a convenience function "include" to load from absolute path (from working directory) instead of using "require" which uses relative path.

Example, if you have /lib/utils.js, you can load it anywhere by using 'include':

```
var utils = include('/lib/utils.js');

...
```