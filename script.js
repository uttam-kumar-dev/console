
var previousLine = document.querySelector('#command_interface input');
var currentCommandExecution = null;
var commandStorage = {};
var storeUserCommands = [];
var global_commands = {};
var supportedCommands = () => {

    return global_commands;

}

const registerCommandStorage = (command_name) => {
    if (!(command_name in commandStorage)) {
        commandStorage[command_name] = {};
    }
}

const getTextNode = (content) => {
    let span = document.createElement('span');
    span.innerText = content;
    return span;
}

const getCommandInput = (options = {}) => {
    let input = document.createElement('input');
    input.setAttribute('class', 'command-input bg-dark border-0 outline-0 shadow-none text-white');

    for (key in options) {
        input.setAttribute(key, options[key]);
    }

    return input;
}

const getLineStarter = (show_arrow = true, suffix = null) => {
    let p = document.createElement('p');
    p.setAttribute('class', 'mb-0');

    if (show_arrow) {
        let node = getTextNode('>');
        node.setAttribute('class', 'text-success fw-bold me-1');
        p.appendChild(node);
    }

    if (suffix) {
        let node = getTextNode(suffix);
        node.setAttribute('class', '');
        p.appendChild(node);
    }

    return p;
}

const getLineWrapper = () => {
    let div = document.createElement('div');
    div.setAttribute('class', 'cmd-line');
    return div;
}

const addLine = (show_arrow = true, content = null, content_type = 'text', command_input_options = {}, line_prefix = null) => {
    let wrapper = getLineWrapper();
    wrapper.appendChild(getLineStarter(show_arrow, line_prefix));
    const newNode = content_type == 'text' ? getTextNode(content) : getCommandInput(command_input_options);
    wrapper.appendChild(newNode);

    document.querySelector('#command_interface').appendChild(wrapper);

    if (newNode.nodeName == 'INPUT') {
        newNode.focus();
    }

    postRunChecks();

    previousLine = newNode;


}

const postRunChecks = () => {
    previousLine.setAttribute('readonly', true);
}

const getCommandWrapper = () => {
    return previousLine;
}

const storeCommand = (value) => {
    if (value == '') return;

    if (!storeUserCommands.includes(value)) {
        storeUserCommands.push(value);
    }
}

const registerCommand = (command, obj) => {
    if (command in supportedCommands()) {
        throw new Error("Command already added: " + command);
    }

    global_commands[command] = obj;

}

const processCommand = () => {
    let command = getCommandWrapper();

    if (command.hasAttribute('data-command-attached')) {
        if (command.value == 'exit') {
            terminateCurrentCommand();
            return;
        }

        currentCommandExecution(command);
        return;
    }

    if (command.value == null || command.value == '') {
        addLine(true, null, 'Input');
        return;
    }

    if (command.value in supportedCommands()) {
        let commands = supportedCommands();
        let ref = commands[command.value];

        if (ref.attachedwith != undefined) {
            ref = commands[ref.attachedwith]
        }

        ref.callable(document.querySelector('#command_interface'));
        storeCommand(command.value);
        return;
    }

    storeCommand(command.value);
    addLine(true, 'Invalid Command ! System cannot find the command: ' + command.value);
    addLine(true, null, 'input');

}

var queueIndex = 0;
var is_arrow_key_pressed = false;
document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        processCommand();
        queueIndex = 0;
        is_arrow_key_pressed = false;
    }

    //we have to show the previous command which is run by user
    if (event.key === 'ArrowUp') {

        if (storeUserCommands.length == 0) return;

        if (!is_arrow_key_pressed) queueIndex = storeUserCommands.length - 1;

        console.log(queueIndex);

        let lastInput = document.querySelector('.cmd-line:last-child input');

        if (queueIndex >= 0) {
            lastInput.value = storeUserCommands[queueIndex];
            queueIndex--;
        }

        if (queueIndex < 0) {
            queueIndex = 0;
        }

        is_arrow_key_pressed = true;

    } else if (event.key === 'ArrowDown') {
        if (storeUserCommands.length == 0) return;

        if (!is_arrow_key_pressed) queueIndex = 0;

        console.log(queueIndex);

        let lastInput = document.querySelector('.cmd-line:last-child input');

        if (queueIndex <= storeUserCommands.length - 1) {
            lastInput.value = storeUserCommands[queueIndex];
            queueIndex++;
        }

        if (queueIndex > storeUserCommands.length - 1) {
            queueIndex = storeUserCommands.length - 1
        }

        is_arrow_key_pressed = true;
    }

});


//command related functions
const cleanInterFace = (main_wrapper) => {
    main_wrapper.innerHTML = '';
    addLine(true, null, 'input');
}
registerCommand('clean', { 'callable': cleanInterFace, 'description': 'This command cleans the terminal.' });

const showHelp = () => {
    addLine(true, 'Below are the commands, Which is supported by the system');
    let commands = supportedCommands();
    for (key in commands) {
        if (commands[key].attachedwith != undefined) continue;

        let helpText = key + ': ' + commands[key].description;
        addLine(false, helpText);
    }
    addLine(true, null, 'Input');
}

registerCommand('help', { 'callable': showHelp, 'description': 'This command print the help text.' });

const createUser = (_reference) => {

    registerCommandStorage('createUser');
    currentCommandExecution = createUser;

    let required_fields = ['email', 'password', 'confirmPassword'];
    let inputOptions = { 'data-command-attached': 'createUser' };
    inputOptions['data-field'] = required_fields[0];

    if (_reference.nodeName == 'INPUT') {
        commandStorage['createUser'][_reference.getAttribute('data-field')] = _reference.value;

    }

    if (commandStorage.createUser.email == undefined) {
        addLine(false, null, 'Input', inputOptions, 'Enter Email :');
        return;
    } else if (commandStorage.createUser.password == undefined) {
        inputOptions['data-field'] = required_fields[1];
        inputOptions['type'] = 'password';
        addLine(false, null, 'Input', inputOptions, 'Enter Password :');
        return;
    } else if (commandStorage.createUser.confirmPassword == undefined) {
        inputOptions['data-field'] = required_fields[2];
        inputOptions['type'] = 'password';
        addLine(false, null, 'Input', inputOptions, 'Password again:');
        return;
    }

    //now process user information
    if (commandStorage.createUser.password != commandStorage.createUser.confirmPassword) {
        commandStorage.createUser.password = undefined;
        commandStorage.createUser.confirmPassword = undefined;
        addLine(true, 'Validation error ! Password not matched');
        createUser(this);
        return;
    }

    //now we have to process the information which is entered by the user
    addLine(true, 'Please Wait ! Creating User...');

    //TODO : Make ajax call to server register user, if details are valid, and append the server response

}

registerCommand('sudo create', { 'callable': createUser, 'description': 'This command creates a user in the system.' });

const loginUser = (_reference) => {
    registerCommandStorage('loginUser');
    currentCommandExecution = loginUser;
    let inputOptions = { 'data-command-attached': 'loginUser' };
    addLine(false, null, 'Input', inputOptions, 'Enter Email:');

    console.log(_reference);

}

registerCommand('sudo login', { 'callable': loginUser, 'description': 'This command is used to login the user in the system.' });

const terminateCurrentCommand = () => {
    commandStorage = {};
    currentCommandExecution = null;
    addLine(true, null, 'Input');
}

registerCommand('exit', { 'callable': terminateCurrentCommand, 'description': 'This command terminate the current command execution.' });

const showTime = () => {
    let currentDate = new Date();
    let hours = currentDate.getHours();
    let minutes = currentDate.getMinutes();
    let seconds = currentDate.getSeconds();

    let currentTime = hours + ":" + minutes + ":" + seconds;
    addLine(false, 'The Time is: ' + currentTime);
    addLine(true, null, 'Input');
}

registerCommand('time', { 'callable': showTime, 'description': 'Display the current time.' });

const showInfo = () => {
    let info = navigator.userAgent;
    addLine(false, info);
    addLine(true, null, 'Input');
}

registerCommand('whoami', { 'callable': showInfo, 'description': 'This command display the browser information.' });

const showNetworkInfo = () => {
    addLine(false, "Connection status: " + (navigator.onLine ? 'Online' : 'Offline'));
    addLine(false, "Network type: " + navigator.connection.type ?? '--');
    addLine(false, "Downlink speed: " + navigator.connection.downlink + " Mbps");
    addLine(false, "Effective connection type: " + navigator.connection.effectiveType);
    addLine(false, "RTT (Round Trip Time): " + navigator.connection.rtt + " ms");
    addLine(false, "Data saver enabled: " + (navigator.connection.saveData ? 'Yes' : 'No'));

    addLine(true, null, 'Input');
}

registerCommand('netinfo', { 'callable': showNetworkInfo, 'description': 'Display the network information' });

const visitUrl = (refernce) => {
    currentCommandExecution = visitUrl;

    if (refernce.nodeName == 'INPUT') {
        addLine(false, 'Opening URL....');

        setTimeout(function () {
            location.href = refernce.value;
        }, 2000);
        return;
    }
    addLine(false, null, 'Input', { 'data-command-attached': 'visitUrl' }, 'Enter Url: ');
}
//using anonymous functions for smaller task
registerCommand('firstprogram', {
    'callable': () => {
        addLine(false, 'Hello world !!');
        addLine(true, null, 'Input');
    }, 'description': 'Prints the first program used by many developers.'
});

registerCommand('date', {
    'callable': () => {
        addLine(false, new Date().toString());
        addLine(true, null, 'Input');
    }, 'description': 'Current date'
});

registerCommand('reload', {
    'callable': () => {
        addLine(false, "Reloading...");
        setTimeout(() => {
            location.href = location.href;
        }, 3000);
    }, 'description': 'Refresh the terminal, and make a full page refresh'
});

//we can refernce the command to other command if command task are same
registerCommand('cls', { 'attachedwith': 'clean' });
registerCommand('clear', { 'attachedwith': 'clean' });
registerCommand('refresh', { 'attachedwith': 'reload' });
registerCommand('visit', { 'callable': visitUrl, 'description': 'Visit a particular url' });