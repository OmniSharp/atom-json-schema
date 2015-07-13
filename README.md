# atom-yeoman

![Yeoman](https://avatars2.githubusercontent.com/u/1714870?v=3&s=50) &nbsp; and &nbsp; ![Atom](https://atom.io/assets/logo-small-a4d7adc7a89f0730d70aadb5e0c35ccf.png)

It's like match made in heaven!

![In Action](https://github.com/david-driscoll/atom-yeoman/raw/master/atom-yeoman.gif)

No longer do you have to leave the confines of your atom editor to scaffold your new view, or to create a new project.  (You still can if you prefer!!).

# Current known issues
* Only "list" and "text" question types are supported.  (More to come!)

# Less task switching...
Need to add a model or a controller?  Normally use a generator for that task?   You can run sub generators too...

![In Action](https://github.com/david-driscoll/atom-yeoman/raw/master/atom-yeoman-sub.gif)

# Empowering Packages
atom-yeoman lets package authors bundle one or more generators and execute them programmatically through the atom-yeoman framework.

## `yeoman-environment` service
atom-yeoman exposes the `yeoman-environment` service.  This lets you call `atom-yeoman` as you see fit for your package.

### run(generator: string, cwd?: string)
Runs the given generator (aspnet:app, aspnet:Class, jquery, etc.)
You may optionally give the cwd that you would like the generator to work from.

### start(prefix?: string, cwd?: string)
Runs atom-yeoman as if you had run the `yo` command.
Optionally you can give the prefix, so you can have yeoman only show a subset of the available generators.
You may optionally give the cwd that you would like the generator to work from.

### Note on setting cwd
If you don't set the cwd, then atom-yeoman will try to determine the best location for you.

* If atom has no projects open, a warning notification is thrown.
* If atom has one project open, that projects path is chosen.
* If atom has more than one project open, then the user will be prompted to choose the correct path.
