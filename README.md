A simple browser based Mock terminal. I have created this terminal for fun, and also i have added some commands, like time, date, help, whoami and more.

if you want to register your own commands, just use

```
registerCommand('command_name', { 'callable': A_FUNCTION, 'description': 'command description' });

```

That's it.

When user enter command and hit  enter then its associated function called, if you want to store user input and process this input after a while, you can assign the storage to your command.

```
function my_callback(){
    registerCommandStorage('my_callback');
    currentCommandExecution = my_callback; //function reference, for next command call

    //rest of your logic here
}
```

I am using this terminal for one of my website where user login to their account using this terminal.

You can also use UP and DOWN arrow to see your previous commands.