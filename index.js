const electron = require('electron')
const {BrowserWindow, app, ipcMain, dialog, webContents} = electron
const db = require('./config/database/dbconfig')

let mainWindow
let modalAddAccount
let modalEditAccount
let modalLoginAccount
mainWin = () => {
    mainWindow = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true
            },
            width: 1200,
            height: 700,
            title: 'My First App',
            autoHideMenuBar: true
        }
    )
    mainWindow.loadFile('index.html')
}

const modalLogin = () => {
    modalLoginAccount = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true
            },
            frame: false,
            resizable: false,
            closable: false,
            modal: true,
            parent: mainWindow,
            width: 250,
            height: 150,
            autoHideMenuBar: true
        }
    )
    modalLoginAccount.loadFile('login.html')
}

const addAccountModal = () => {
    modalAddAccount = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true
            },
            width: 300,
            height: 250,
            autoHideMenuBar: true,
            modal: true,
            parent: mainWindow,
            resizable: false,
            minimizable: false
        }
    )
    modalAddAccount.loadFile('modal-add-account.html')
}

const editAccountModal = (id, item, description, accountId) => {
    modalEditAccount = new BrowserWindow(
        {
            webPreferences: {
                nodeIntegration: true
            },
            width: 300,
            height: 250,
            autoHideMenuBar: true,
            modal: true,
            parent: mainWindow,
            resizable: false,
            minimizable: false
        }
    )
    modalEditAccount.loadFile('modal-edit-account.html')
    modalEditAccount.webContents.on('did-finish-load', () => {
        modalEditAccount.webContents.send('data', id, item, description, accountId)
    })
}

app.on('ready', () => {
    mainWin()
    modalLogin()
    db.connect()
})

ipcMain.on('login', (e, username, password) => {
    let query = `select *, count(*) as count from users where username = '${username}' and password = '${password}'`
    db.query(query, (err, result) => {
        if(err) throw err
        let rowCount = result[0].count
        let userId = result[0].id
        if(rowCount == 0) {
            dialog.showErrorBox('Invalid Data','Username or password is incorrect')
        } else {
            modalLoginAccount.closable = true
            modalLoginAccount.close()
            mainWindow.webContents.send('app:active', username, userId)
        }
    })
})
ipcMain.on('app:logout', () => {
    modalLogin()
})
ipcMain.on('open-modal:add-account', () => {
    addAccountModal()
})

ipcMain.on('close-modal:add-account', () => {
    modalAddAccount.close()
})
ipcMain.on('add-account', (e, accountName, accountUrl) => {
    if(accountName === "") {
        dialog.showMessageBox(
            {
                title: 'Alert',
                message: 'account name is required'
            }
        )
    } else {
        let check_name = `select count(*) as count from account where account_name = '${accountName}'`
        db.query(check_name, (err, result) => {
            if (err) throw err
            let rowNumber = result[0].count
            if(rowNumber < 1) {
                let query = `insert into account(account_name, account_url) values('${accountName}','${accountUrl}')`
                db.query(query, err => {
                    if (err) throw err
                    let query = `select * from account where account_name = '${accountName}'`
                    db.query(query, (err, result) => {
                        if (err) throw err
                        let accountId = result[0].account_id
                        mainWindow.webContents.send('load:detail-form', accountId, accountName)
                    })
                    modalAddAccount.close()
                })
            } else {
                dialog.showMessageBox(
                    {
                        title: 'Alert',
                        message: 'nama akun sudah ada, silahkan gunakan nama akun yang lain',
                        type: 'info'
                    }
                )
            }
        })
    }
})

ipcMain.on('open-modal:edit-account-info', (e, id, item, description, accountId) => {
    editAccountModal(id, item, description, accountId)
})

ipcMain.on('close-modal:edit-account-info', () => {
    modalEditAccount.close()
})

ipcMain.on('submit:edit-account-info', (e, id, newItem, newDescription, accountId) => {
    if(newItem === "" || newDescription === "") {
        dialog.showMessageBox(
            {
                title: 'Alert',
                message: 'user dan password input harus diisi'
            }
        )
    } else {
        let query = `update account_info set item='${newItem}', description='${newDescription}' where id = ${id}`
        db.query(query, err => {
            if (err) throw err
            modalEditAccount.close()
            mainWindow.webContents.send('load:account-info', accountId)
        })
    }
})
ipcMain.on('delete:account', (e, id) => {
    let dialogBox = dialog.showMessageBoxSync(
        {
            title: 'Delete Account',
            type: 'question',
            buttons: ['No','Yes'],
            defaultId: [0,1],
            message: 'Apakah anda yakin ingin menghapus akun ini?' 
        }
    )
    if(dialogBox == 1) {
        let queryDelete = `delete from account where account_id = ${id}`
        db.query(queryDelete, err => {
            if (err) throw err
            mainWindow.webContents.send('success:delete-account')
        })
    }
})