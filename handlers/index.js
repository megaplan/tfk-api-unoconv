'use strict'

const fs = require('fs')
const uuid = require('uuid')
const formats = require('../lib/data/formats.json')
const pkg = require('../package.json')
const { exec } = require('child_process');

module.exports.handleUpload = (request, reply) => {
    const convertToFormat = request.params.format
    const data = request.payload
    if (data.file) {
        const nameArray = data.file.hapi.filename.split('.')
        const fileEndingOriginal = nameArray.pop()
        const temporaryName = uuid.v4()
        const outDir = process.cwd() + '/uploads/'
        const pathPre = outDir + temporaryName
        const fileNameTempOriginal = pathPre + '.' + fileEndingOriginal
        const fileNameTempResult = pathPre + '.' + convertToFormat
        const file = fs.createWriteStream(fileNameTempOriginal)

        file.on('error', (error) => {
            console.error(error)
        })

        data.file.pipe(file)

        data.file.on('end', (err) => {
            if (err) {
                console.error(err)
                reply(err)
            } else {
                exec('soffice --headless --convert-to '+convertToFormat+' --outdir '+outDir+' '+fileNameTempOriginal, (err, stdout, stderr) => {
                   if (err) {
                       reply(err);
                   }
                   reply.file(fileNameTempResult);
                });
            }
       })
    }
}

module.exports.showFormats = (request, reply) => {
    reply(formats)
}

module.exports.showFormat = (request, reply) => {
    const params = request.params
    const format = params ? formats[request.params.type] : false
    if (!format) {
        reply('Format type not found').code(404)
    } else {
        reply(format)
    }
}

module.exports.showVersions = (request, reply) => {
    let versions = {}
    Object.keys(pkg.dependencies).forEach((item) => {
        versions[item] = pkg.dependencies[item]
    })
    reply(versions)
}

module.exports.healthcheck = (request, reply) => {
    reply({ uptime: process.uptime() })
}
