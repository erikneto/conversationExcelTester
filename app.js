//node bltest.js -u 123 -p 321 -w 456 -s 654
const AssistantV1 = require('ibm-watson/assistant/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const XLSX = require('xlsx');
const fs = require("fs");


let args = require('parse-cli-arguments')({
    options: {
        assistantURL: { alias: 'u' },
        pwdWCS: { alias: 'p' },
        workspaceWCS: { alias: 'w' },
        sourceFile: { alias: 's' },
        destinationFile: { alias: 'd' }
    }
});

const assistant = new AssistantV1({
    version: '2020-04-01',
    authenticator: new IamAuthenticator({
        apikey: args.pwdWCS,
    }),
    // url: 'https://api.us-south.assistant.watson.cloud.ibm.com',
    url: args.assistantURL
});

const examples = JSON.parse(fs.readFileSync(args.sourceFile).toString('utf8'))


let current = 0;
let totalRows = examples.length;
let doneRows = 1;


const testes = examples.map((e, i) => {
    return testarMsg(e);
})

Promise.all(testes).then((result) => {
    const nwb = { SheetNames: ['Exemplos'], Sheets: { Exemplos: {} } };
    nwb.Sheets.Exemplos['A1'] = {
        t: 's',
        v: 'Call ID'
    };
    nwb.Sheets.Exemplos['B1'] = {
        t: 's',
        v: 'Exemplo'
    };
    nwb.Sheets.Exemplos['D1'] = {
        t: 's',
        v: 'Intenção 1 antiga'
    };
    nwb.Sheets.Exemplos['D1'] = {
        t: 's',
        v: 'Confiança 1 antiga'
    };
    nwb.Sheets.Exemplos['E1'] = {
        t: 's',
        v: 'Intenção 2 antiga'
    };
    nwb.Sheets.Exemplos['F1'] = {
        t: 's',
        v: 'Confiança 2 antiga'
    };
    nwb.Sheets.Exemplos['G1'] = {
        t: 's',
        v: 'Intenção nova'
    };
    nwb.Sheets.Exemplos['H1'] = {
        t: 's',
        v: 'Confiança nova'
    };

    result.forEach((e, i) => {
        nwb.Sheets.Exemplos['A' + (i + 2)] = {
            t: 's',
            v: e.callId
        };
        nwb.Sheets.Exemplos['B' + (i + 2)] = {
            t: 's',
            v: e.input
        };
        nwb.Sheets.Exemplos['C' + (i + 2)] = {
            t: 's',
            v: e.originalFirstIntent
        };
        nwb.Sheets.Exemplos['D' + (i + 2)] = {
            t: 'n',
            v: e.originalFirstConfidence
        };
        nwb.Sheets.Exemplos['E' + (i + 2)] = {
            t: 's',
            v: e.originalSecondIntent
        };
        nwb.Sheets.Exemplos['F' + (i + 2)] = {
            t: 'n',
            v: e.originalSecondConfidence
        };
        nwb.Sheets.Exemplos['G' + (i + 2)] = {
            t: 's',
            v: e.intentNew.intent
        };
        nwb.Sheets.Exemplos['H' + (i + 2)] = {
            t: 'n',
            v: e.intentNew.confidence
        };
    })
    nwb.Sheets.Exemplos['!ref'] = 'A1:H' + (result.length + 1);
    XLSX.writeFile(nwb, args.destinationFile);
})
    .catch((error) => { console.log(error) })

function testarMsg(input, retries) {
    return new Promise(async (resolve, reject) => {
        retries = (retries || 0) + 1;
        while(current > 500){
            await pause(500);
        }
        current++;
        assistant.message({
            workspaceId: args.workspaceWCS,
            input: { 'text': input.input }
        }, async (err, response) => {
            current--;
            if (err) {
                // if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].indexOf(err.code) > -1) {
                    await pause(retries*100)
                    return resolve(await testarMsg(input, retries));
                // }
                // return reject(err);
            }

            input.intentNew = {
                intent: 'N/A',
                confidence: 0
            };
            if (response.result.intents.length > 0) {
                input.intentNew = {
                    intent: response.result.intents[0].intent,
                    confidence: response.result.intents[0].confidence
                };
            }
            console.log(`${doneRows++} / ${totalRows} Tentativas: ${retries} / Current: ${current} => ${input.input}`);
            return resolve(input);
        });
    })
}

function pause(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve(true);
        }, ms);
    })
}

// total.reduce((rt, rn, i) => {
//     console.log(`${i}/ ${total.length}`)
//     rt = [...rt, rn.dialog.map((i) => {
//         return { callId: rn._id, ...i };
//     })];
//     return rt;
// }
//     , [])

// processar = (arquivo) => {
//     console.log(arquivo)
//     temp = JSON.parse(fs.readFileSync(arquivo).toString('utf8'));
//     console.log(total.length);
//     for (d of temp) {
//         for (i of d.dialog) {
//             if (!total.find(t => t.input === i.input)) {
//                 total.push({
//                     callId: d._id,
//                     ...i
//                 })
//             }
//         }
//     }
//     console.log(total.length);
// }


// processar("2020-03-27.json")
// processar("2020-03-28.json")
// processar("2020-03-29.json")
// processar("2020-03-30.json")
// processar("2020-03-31.json")
// processar("2020-04-01.json")
// processar("2020-04-02.json")
// processar("2020-04-03.json")
// processar("2020-04-04.json")
// processar("2020-04-05.json")
// processar("2020-04-06.json")
// processar("2020-04-07.json")
// processar("2020-04-08.json")
// processar("2020-04-09.json")
// processar("2020-04-10.json")
// processar("2020-04-11.json")
