const socket = io();

// Elements
const $msgForm = document.getElementById('chatForm');
const $msgFormInput = $msgForm.querySelector('input');
const $msgFormBtn = $msgForm.querySelector('button');
const $locationBtn = document.getElementById('sendLocation');
const $messages = document.getElementById('messages');

// Templates
const messageTemplate = document.getElementById('messageTemplate').innerHTML;
const locationTemplate = document.getElementById('locationTemplate').innerHTML;
const sidebarTemplate = document.getElementById('sidebarTemplate').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const autoscroll = () => {
    // Latest message element
    const $lastMessage = $messages.lastElementChild;

    // Height of last message
    const lastMessageStyles = getComputedStyle($lastMessage);
    const lastMessageMargin = parseInt(lastMessageStyles.marginBottom)
    const lastMessageHeight = $lastMessage.offsetHeight + lastMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have we scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - lastMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (msg) => {
    console.log(msg);
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (msg) => {
    console.log('location message', msg);
    const html = Mustache.render(locationTemplate, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.getElementById('sidebar').innerHTML = html;
});

$msgForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $msgFormBtn.setAttribute('disabled', 'disabled');

    const msg = $msgFormInput.value;

    socket.emit('sendMessage', msg, (error) => {
        $msgFormBtn.removeAttribute('disabled');
        $msgFormInput.value = '';
        $msgFormInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('Message delivered!');
    });
});

$locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!');
    }

    $locationBtn.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        $locationBtn.removeAttribute('disabled');

        const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        socket.emit('sendLocation', coords, () => {
            console.log('Location shared!');
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});