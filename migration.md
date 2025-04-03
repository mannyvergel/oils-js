# Migrating to 10.x.x

There are several breaking changes when upgrading to Oils 10.x primarily because the old mongoose library simply cannot be used anymore, and needed to be upgraded for security.

This list will be populated

## Remove .execPopulate() 

The function ```.execPopulate()``` is not supported anymore. Simply remove it, e.g. ```await Order.populate('items.item');```