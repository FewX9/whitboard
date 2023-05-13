const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const io = new Server(server);
const ejs = require('ejs');
const { initializeApp } = require("firebase/app");
const { getDatabase, set, ref, get, update, remove } = require("firebase/database");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const jwt_key = 'NpRwVBnhUC';
const cookies = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(cookies());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const firebaseConfig = {
    databaseURL: "https://whiteboard-fd6a0-default-rtdb.asia-southeast1.firebasedatabase.app/"
}
const db = getDatabase(initializeApp(firebaseConfig))

app.get('/test', async function (req, res) {

    let room = {}
    const data = await get(ref(db, 'room')).then((result) => {
        if (result.exists()) {
            return result.val();
        }
    }).catch((error) => {
        console.error(error);
    });

    for (const [key, value] of Object.entries(data)) {
        if (value.owner == 'fewx') {
            room[key] = value;
        }
    }
    res.send('ok');
});

app.get('/register', function (req, res) {
    res.render('register');
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.get('/logout', function (req, res) {
    res.clearCookie('token');
    res.redirect('/login');
});

app.get('/profile', function (req, res) {
    const token = req.cookies.token;
    let room = []
    if (token) {
        jwt.verify(token, jwt_key, async function (err, decoded) {
            if (err) {
                res.redirect('/login');
            } else {
                const data = await get(ref(db, 'room')).then((result) => {
                    if (result.exists()) {
                        return result.val();
                    }
                }).catch((error) => {
                    console.error(error);
                });

                if (data) {
                    for (const [key, value] of Object.entries(data)) {
                        if (value.owner == decoded.username.toLowerCase()) {
                            room.push(value);
                        }
                    }
                }

                res.render('profile', { username: decoded.username, room: room });
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/', function (req, res) {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, jwt_key, function (err, decoded) {
            if (err) {
                res.redirect('/login');
            } else {
                res.redirect('/profile');
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.get("/join", function (req, res) {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, jwt_key, function (err, decoded) {
            if (err) {
                res.redirect('/login');
            } else {
                res.render('join');
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/create', function (req, res) {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, jwt_key, function (err, decoded) {
            if (err) {
                res.redirect('/login');
            } else {
                res.render('create');
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/board', function (req, res) {
    const room = req.query.room;
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, jwt_key, function (err, decoded) {
            if (err) {
                res.redirect('/login');
            } else {
                if (room) {
                    get(ref(db, `room/` + room)).then((result) => {
                        if (result.exists()) {
                            const data = result.val();
                            if (data.owner == decoded.username.toLowerCase()) {
                                res.render('board', { room: data, owner: true });
                            } else {
                                res.render('board', { room: data, owner: false });
                            }
                        } else {
                            res.redirect('/join');
                        }
                    }).catch((error) => {
                        console.error(error);
                    });
                } else {
                    res.redirect('/join');
                }
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.post('/del_board', function (req, res) {
    const room = req.body.room;
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, jwt_key, function (err, decoded) {
            if (err) {
                res.send({ status: 'error', message: 'กรุณาเข้าสู่ระบบ' });
            } else {
                get(ref(db, `room/` + room)).then((result) => {
                    if (result.exists()) {
                        const data = result.val();
                        if (data.owner == decoded.username.toLowerCase()) {
                            remove(ref(db, `room/` + room));
                            res.send({ status: 'success', message: 'ลบห้องสำเร็จ' });
                        } else {
                            res.send({ status: 'error', message: 'คุณไม่ใช่เจ้าของห้อง' });
                        }
                    } else {
                        res.send({ status: 'error', message: 'ไม่พบห้องนี้' });
                    }
                }).catch((error) => {
                    console.error(error);
                });
            }
        });
    } else {
        res.send({ status: 'error', message: 'กรุณาเข้าสู่ระบบ' });
    }
});

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    get(ref(db, 'account/' + username.toLowerCase())).then((result) => {
        if (result.exists()) {
            res.send({ status: 'error', message: 'ผู้ใช้งานนี้มีอยู่แล้ว' });
        } else {
            set(ref(db, 'account/' + username.toLowerCase()), {
                username: username,
                password: hash
            });
            res.send({ status: 'success', message: 'สมัครสมาชิกสำเร็จ' });
        }
    }).catch((error) => {
        console.error(error);
    }
    );
})

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    get(ref(db, 'account/' + username.toLowerCase())).then((result) => {
        if (result.exists()) {
            const data = result.val();
            if (bcrypt.compareSync(password, data.password)) {
                const token = jwt.sign({ username: data.username }, jwt_key);
                res.cookie('token', token);
                res.send({ status: 'success', message: 'เข้าสู่ระบบสำเร็จ' });
            } else {
                res.send({ status: 'error', message: 'รหัสผ่านไม่ถูกต้อง' });
            }
        } else {
            res.send({ status: 'error', message: 'ไม่พบผู้ใช้งานนี้' });
        }
    }).catch((error) => {
        console.error(error);
    }
    );
})

app.post('/join', function (req, res) {
    const room = req.body.room;
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, jwt_key, function (err, decoded) {
            if (err) {
                res.send({ status: 'error', message: 'กรุณาเข้าสู่ระบบ' });
            } else {
                res.send({ status: 'success', message: 'เข้าสู่ห้องสำเร็จ' });
            }
        });
    } else {
        res.send({ status: 'error', message: 'กรุณาเข้าสู่ระบบ' });
    }
});

app.post('/create', function (req, res) {
    const roomname = req.body.roomname;
    const token = req.cookies.token;
    const uuid = uuidv4();
    if (token) {
        jwt.verify(token, jwt_key, function (err, decoded) {
            if (err) {
                res.send({ status: 'error', message: 'กรุณาเข้าสู่ระบบ' });
            } else {
                get(ref(db, `room/` + uuid)).then((result) => {
                    if (result.exists()) {
                        res.send({ status: 'error', message: 'ห้องนี้มีอยู่แล้ว' });
                    } else {
                        set(ref(db, `room/` + uuid), {
                            roomname: roomname,
                            owner: decoded.username.toLowerCase(),
                            uuid: uuid,
                            canvas_object: {},
                            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAvCAYAAABaIGwrAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABmSURBVGhD7dAxAQAwEAOh+jedzn8aQAJvHEJCSAgJISEkhISQEBJCQkgICSEhJISEkBASQkJICAkhISSEhJAQEkJCSAgJISEkhISQEBJCQkgICSEhJISEkBASQkJICAkhISSEHNsH0uzA8GRs6L4AAAAASUVORK5CYII='
                        });
                        res.send({ status: 'success', message: 'สร้างห้องสำเร็จ', room: uuid });
                    }
                }).catch((error) => {
                    console.error(error);
                });
            }
        });
    } else {
        res.send({ status: 'error', message: 'กรุณาเข้าสู่ระบบ' });
    }
});

io.on('connection', (socket) => {
    socket.on('join', function (room) {
        socket.join(room);
        // get data from firebase
        get(ref(db, `room/` + room)).then((result) => {
            if (result.exists()) {
                const data = result.val();
                socket.emit('update', data.image);
            }
        }).catch((error) => {
            console.error(error);
        });
        // get cookie from socket
        const cookie = socket.request.headers.cookie;
        if (cookie) {
            const token = cookie.split('token=')[1];
            jwt.verify(token, jwt_key, function (err, decoded) {
                if (err) {
                    console.log(err)
                } else {
                    socket.to(room).emit('join', room, decoded.username);
                }
            });
        }
    });

    socket.on('update', function (data, room) {
        socket.to(room).emit('update', data);
    });

    socket.on('update_img', function (data, room, canvas_object) {0
        update(ref(db, `room/` + room), {
            image: data,
            Object: canvas_object
        });
    });

    socket.on('disconnect', () => {
        // get cookie from socket
        const cookie = socket.request.headers.cookie;
        if (cookie) {
            const token = cookie.split('token=')[1];
            jwt.verify(token, jwt_key, function (err, decoded) {
                if (err) {
                    console.log(err)
                } else {
                    socket.broadcast.emit('userdisconnect', decoded.username);
                }
            });
        }
    });
});

server.listen(3000, () => {
    console.log('http://localhost:3000');
});