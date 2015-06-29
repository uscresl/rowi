multiaccordion.jquery
================

MultiAccordion plugin for jQuery

Allows you to have **multiple accordions** open at the same time and **nested accordions**


Pierre Skowron 2014 - [www.pskowron.info](http://www.pskowron.info)

#Dependencies
In ordre to have this plugin fully working, you have to add these files to your project
- [jQuery](http://www.jquery.com)
- [jQuery UI](http://www.jqueryui.com)


#How to use
`$(selector).multiaccordion(method, options);`

See **example.html** for full example code

####Method (String)
- `init` : *initialize multiaccordion - default if no method defined*
- `open` : *open selected accordion(s)*
- `close` : *close selected accordion(s)*

####Options (Object)
- `header` (String) : *selector for the accordion(s) header*
- `container` (String) : *selector for the accordion(s) container*
- `closeIcon` (String) : *jQuery UI icon when accordion is closed*
- `openIcon` (String) : *jQuery UI icon when accordion is open*
- `initialState` (String) : *initial state of accordion(s) ("open" or "close")*
- `animation` (Boolean) : *whether the content display is animated or not*
