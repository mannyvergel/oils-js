LIBRARY FOLDER
========================

Just a convention to organize your javascript files. Put your custom js files here, and there's already a convenience function "include" to load from absolute path (from working directory) instead of using "require" which uses relative path.

Example, if you have /lib/utils.js, you can load it by:

```
var utils = include('/lib');
...
```