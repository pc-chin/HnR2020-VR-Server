// All socket functions (io is passed from app.js)

/* Custom socket variables:
-  data_guid: GUID of the socket
-  data_type: The type of socket (client or robot)
-  data_rtc: The RTC info of the socket
*/

const AppClient = require('../models/AppClient')

const auth = function(io) { 
    return {
        authenticate: (socket, data, callback) => {
            const guid = data.guid
            const token = data.token

            socket.data_guid = guid
            AppClient.findOne({guid, token}, (e, client) => {
                if (!e && client) {
                    socket.data_type = client.type
                }
                callback(null, !e && client)
            })
        },
        disconnect: (socket) => {
            AppClient.deleteOne({ guid: socket.data_guid }, (e) => console.log('Error deleting socket with guid', guid, '\nError is', e))
            if (socket.data_type === 'robot') {
                io.emit('clientRemovePeer')
            } else {
                io.emit('robotRemovePeer', socket.data_rtc)
            }
        },
        timeout: 5000
    }
}

const connection = function(io) {
    // All functions starting with robot would only be sent to/from robots, vice versa for clients
    return (socket) => {
        // socket.on('join') is handled by auth.postAuthenticate

        // All client side function receivers
        socket.on('clientSendSessionInfo', (rtcInfo, callback) => {
            socket.data_rtc = rtcInfo
            AppClient.findOne({ type: 'robot' }, (e, client) => {
                if (e) {
                    console.log('Error in database query, error is', e)
                } else if (client) {
                    io.emit('robotAddPeer', socket.data_rtc)
                    io.emit('robotRequestUpdateAll')
                }
                callback()
            })
        })

        socket.on('clientRotate', (data, callback) => {
            io.emit('robotRotate', data)
            callback()
        })

        socket.on('clientStartMoving', (data, callback) => {
            io.emit('robotStartMoving')
            callback()
        })

        socket.on('clientStopMoving', (data, callback) => {
            io.emit('robotStopMoving')
            callback()
        })

        // All robot side function receivers
        socket.on('robotSendSessionInfo', (rtcInfo, callback) => {
            socket.data_rtc = rtcInfo
            io.emit('clientAddPeer', socket.data_rtc)

            // All sockets are assumed to be peers
            const peerRtcList = []
            const socketList = io.sockets.sockets
            for (var socketId in socketList) {
                const socket = socketList[socketId]
                peerRtcList.push(socket.data_rtc)
            }
            socket.emit('robotAddMultiplePeers', peerRtcList)
            callback()
        })
        
        socket.on('robotUpdateData', (data, callback) => {
            io.emit('clientUpdateData', data)
            callback()
        })
    }
}

module.exports = { auth, connection }