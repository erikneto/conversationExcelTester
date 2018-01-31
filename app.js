//node bltest.js -u 123 -p 321 -w 456 -s 654
const Conversation = require('watson-developer-cloud/conversation/v1');
const XLSX = require('xlsx');


let args = require('parse-cli-arguments')({
    options: {
        userWCS: { alias: 'u' },
        pwdWCS: { alias: 'p' },
        workspaceWCS: { alias: 'w' },
        sourceFile: { alias: 's' },
        destinationFile: { alias: 'd' }
    }
});

cs = new Conversation({
    username: args.userWCS,
    password: args.pwdWCS,
    version_date: '2017-05-26'
});

const wb = XLSX.readFile(args.sourceFile);
const examples = XLSX.utils.sheet_to_json(wb.Sheets['Exemplos'], { raw: true });

const testes = examples.map((e) => {
    return testarMsg(e.Exemplos);
})

Promise.all(testes).then((result) => {
    const nwb = { SheetNames: ['Exemplos'], Sheets: { Exemplos: {} } };
    nwb.Sheets.Exemplos['A1'] = {
        t: 's',
        v: 'Exemplo'
    };
    nwb.Sheets.Exemplos['B1'] = {
        t: 's',
        v: 'Intenção'
    };
    nwb.Sheets.Exemplos['C1'] = {
        t: 's',
        v: 'Confiança'
    };

    result.forEach((e, i) => {
        nwb.Sheets.Exemplos['A' + (i + 2)] = {
            t: 's',
            v: e.input
        };
        nwb.Sheets.Exemplos['B' + (i + 2)] = {
            t: 's',
            v: e.intent.intent
        };
        nwb.Sheets.Exemplos['C' + (i + 2)] = {
            t: 'n',
            v: e.intent.confidence
        };
    })
    nwb.Sheets.Exemplos['!ref'] = 'A1:C' + (result.length + 1);
    XLSX.writeFile(nwb, args.destinationFile);
})


function testarMsg(input) {
    return new Promise((resolve, reject) => {
        cs.message({
            workspace_id: args.workspaceWCS,
            input: { 'text': input }
        }, function (err, response) {
            if (err)
                return reject(err);

            let intent = {
                intent: 'N/A',
                confidence: 0
            };
            if (response.intents.length > 0) {
                intent = {
                    intent: response.intents[0].intent,
                    confidence: response.intents[0].confidence
                };
            }
            return resolve({
                input,
                intent
            });
        });
    })
}