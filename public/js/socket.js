var socket = io('http://178.128.92.174/');

const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');

async function update_img(socket) {
    const canvas_image = canvas.toDataURL('image/jpeg', 1.0);
    socket.emit('update_img', canvas_image, room, canvas.toJSON());
}

socket.on('connect', function () {
    console.log('connected');
    socket.emit('join', room);

    socket.on('update', function (data) {
        update_img(socket);
        canvas.loadFromJSON(data, canvas.renderAll.bind(canvas));
    });

    socket.on('join', function (data, username) {
        console.log(data, username);
        if ($(`#${username}`).length == 0) {
            $("#user_lst").append(`<p id="${username}">${username}</p>`);
        }
    });
   
    socket.on('userdisconnect', function (username) {
        $(`#${username}`).remove();
    });
});

canvas.on('object:modified', function (options) {
    socket.emit('update', canvas.toJSON(), room);
});

canvas.on('path:created', function (options) {
    socket.emit('update', canvas.toJSON(), room);
});

canvas.on('object:moving', function (options) {
    socket.emit('update', canvas.toJSON(), room);
});

setInterval(function () {
    update_img(socket);
}, 5000);
