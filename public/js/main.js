const canvas = new fabric.Canvas('myCanvas');
canvas.setHeight(window.innerHeight);
canvas.setWidth(window.innerWidth);

var color = "#000000";
let is_hightlight = false;
canvas.freeDrawingBrush.width = 5;

$("#xcolor").change(function () {
    if (is_hightlight) {
        color = $(this).val() + "80";
    } else {
        color = $(this).val();
    }
    canvas.freeDrawingBrush.color = color;
});

$("#pensize").change(function () {
    canvas.freeDrawingBrush.width = $(this).val();
    document.getElementById("lpensize").innerHTML = "Size: " + canvas.freeDrawingBrush.width;
});

$("#register").click(function () {
    const username = $("#username").val();
    const password = $("#password").val();

    if (username == "") {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณากรอกชื่อผู้ใช้งาน',
            confirmButtonText: 'ตกลง'
        })
        return;
    }

    if (password == "") {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณากรอกรหัสผ่าน',
            confirmButtonText: 'ตกลง'
        })
        return;
    }

    if (password != $("#cpassword").val()) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'รหัสผ่านไม่ตรงกัน',
            confirmButtonText: 'ตกลง'
        })
        return;
    }

    $.post("/register", {
        username: username,
        password: password
    }, function (data) {
        if (data.status == 'success') {
            Swal.fire({
                icon: 'success',
                title: 'สมัครสมาชิกสำเร็จ',
                text: 'คุณสามารถเข้าสู่ระบบได้เลย',
                confirmButtonText: 'ตกลง'
            }).then((result) => {
                window.location.href = "/login";
            }) 
        } else {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: data.message,
                confirmButtonText: 'ตกลง'
            })
        }
    });
});

$("#login").click(function () {
    const username = $("#username").val();
    const password = $("#password").val();

    if (username == "") {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณากรอกชื่อผู้ใช้งาน',
            confirmButtonText: 'ตกลง'
        })
        return;
    }

    if (password == "") {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณากรอกรหัสผ่าน',
            confirmButtonText: 'ตกลง'
        })
        return;
    }

    $.post("/login", {
        username: username,
        password: password
    }, function (data) {
        if (data.status == 'success') {
            Swal.fire({
                icon: 'success',
                title: 'เข้าสู่ระบบสำเร็จ',
                text: 'คุณสามารถใช้งานได้เลย',
                confirmButtonText: 'ตกลง'
            }).then((result) => {
                window.location.href = "/profile";
            })
        } else {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: data.message,
                confirmButtonText: 'ตกลง'
            })
        }
    });
});

$("#join").click(function () {
    let room = $("#roomid").val();
    console.log(room);
    if (room == "") {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณากรอกรหัสห้อง',
            confirmButtonText: 'ตกลง'
        })
        return;
    }

    const getid = room.split("?room=")[1];
    if (getid) {
        room = getid;
    }
    $.post("/join", {
        room: room
    }, function (data) {
        console.log(data);
        if (data.status == 'success') {
            window.location.href = "/board?room=" + room;
        } else {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: data.message,
                confirmButtonText: 'ตกลง'
            })
        }
    });    
});

$("#create").click(function () {
    const roomname = $("#roomname").val();
    if (roomname == "") {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'กรุณาตั้งชื่อห้อง',
            confirmButtonText: 'ตกลง'
        })
        return;
    }
    $.post("/create", {
        roomname: roomname
    }, function (data) {
        if (data.status == 'success') {
            window.location.href = "/board?room=" + data.room;
        } else {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: data.message,
                confirmButtonText: 'ตกลง'
            })
        }
    });
});

function del_board(room) {
    Swal.fire({
        title: 'คุณแน่ใจหรือไม่?',
        text: "หากลบแล้วจะไม่สามารถกู้คืนได้!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            $.post("/del_board", {
                room: room
            }, function (data) {
                if (data.status == 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: 'ลบห้องสำเร็จ',
                        confirmButtonText: 'ตกลง'
                    }).then((result) => {
                        window.location.href = "/profile";
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: data.message,
                        confirmButtonText: 'ตกลง'
                    })
                }
            });
        }
    })
}

function pen() {
    is_hightlight = false;
    canvas.isDrawingMode = true;
    $("#xcolor").val("#000000");
    color = "#000000";
    canvas.freeDrawingBrush.color = color;

    socket.emit('update', canvas.toJSON(), room);
}

function move() {
    canvas.isDrawingMode = false;
    socket.emit('update', canvas.toJSON(), room);
}

function clearobj() {
    canvas.clear();
    socket.emit('update', canvas.toJSON(), room);
}

function square() {
    if (is_hightlight) {
        $("#xcolor").val("#000000");
        is_hightlight = false;
        color = $("#xcolor").val();
    }
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: color,
        width: 100,
        height: 100
    });
    canvas.add(rect);
    socket.emit('update', canvas.toJSON(), room);
}

function circle() {
    if (is_hightlight) {
        $("#xcolor").val("#000000");
        is_hightlight = false;
        color = $("#xcolor").val();
    }
    const circle = new fabric.Circle({
        radius: 50,
        fill: color,
        left: 100,
        top: 100
    });

    canvas.add(circle);
    socket.emit('update', canvas.toJSON(), room);
}

function triangle() {
    if (is_hightlight) {
        $("#xcolor").val("#000000");
        is_hightlight = false;
        color = $("#xcolor").val();
    }
    const triangle = new fabric.Triangle({
        width: 100,
        height: 100,
        fill: color,
        left: 100,
        top: 100
    });

    canvas.add(triangle);
    socket.emit('update', canvas.toJSON(), room);
}

function highlight_pen() {
    is_hightlight = true;
    canvas.isDrawingMode = true;
    $("#xcolor").val("#FFFF00");
    color = "#FFFF0080";
    canvas.freeDrawingBrush.width = canvas.freeDrawingBrush.width * 2;
    canvas.freeDrawingBrush.color = color;
    socket.emit('update', canvas.toJSON(), room);

}

function eraser() {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = canvas.freeDrawingBrush.width * 2;
    canvas.freeDrawingBrush.color = "#FFFFFF";
    socket.emit('update', canvas.toJSON(), room);
}

document.addEventListener("keydown", function (e) {
    if (e.keyCode == 46) {
        canvas.remove(canvas.getActiveObject());
        socket.emit('update', canvas.toJSON(), room);
    }
});