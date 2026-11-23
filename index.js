const express = require('express');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const auth = require('./auth');
//const {execSync} = require('node:child_process');
const app = express();
const PORT = 3000;

let print_jobs = [];

const PRP_UPDATES = [
  "PIQ", // In Queue
  "RUS", // Unimplemented Script
  "RBA", // Bad Arguments
];

const PIQ_UPDATES = [
  "CSP", // Successful Print
  "EPA", // Printer Aborted
  "EPC", // Printer Cancelled
  "EPS", // Printer Stopped
  "ETO"
];

const SIMPLE_STATUS = {
  "P": "Pending",
  "R": "Rejected",
  "C": "Completed",
  "E": "Error"
}

// middleware for POST requests
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // forms
app.use('/uploads', express.static('uploads'));

app.get('/single-color-text', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Send Print Jobs to My Printer</title></head>
    <body>
      <h1>Single Color Text</h2>
      <h2>Submit Your Details</h2>
      <form action="/api/script/single-color-text" method="POST">
        <label for="text">Text:</label>
        <input type="text" id="text" name="text" required/>
        <br/><br/>
        <label for="red">Red (0-255):</label>
        <input type="number" id="red" name="red" required min="0" max="255"/>
        <label for="green">Green (0-255):</label>
        <input type="number" id="green" name="green" required min="0" max="255"/>
        <label for="blue">Blue (0-255):</label>
        <input type="number" id="blue" name="blue" required min="0" max="255"/>
        <br/><br/>
        <label for="_key">Key:</label>
        <input type="text" id="_key" name="_key" required/>
        <button type="submit">Submit</button>
      </form>
    </body>
    </html>
  `);
});

app.post('/api/script/:script_name', (req, res) => {
  
  const {_key, ...args} = req.body;

  console.log(_key);
  console.log(args);

  //execSync(`{ printf "%%!PS\n/PAuthor (<From: ${keys[req.body.key].name} @ ${timestamp}>) def /PText <${Buffer.from(`${req.body.text}`, 'utf8').toString('hex')}> def /PRed ${req.body.red/255} def /PGreen ${req.body.green/255} def /PBlue ${req.body.blue/255} def\n"; cat ./postscript/single-color-text.ps; } | lpr -P canon_printer`, { encoding: 'utf8' })
  
  auth.user_control_flow(_key, res, () => {
    const now = new Date();
    const id = randomUUID();

    print_jobs.push({
      id,
      script: req.params.script_name,
      user: auth.name(_key),
      args,
      time: now.getTime(),
      status: 'PNR'
    });

    res.format({
      'application/json': () => {
        res.json({id});
      },
      'text/html': () => {
        res.send(`
        <h3>Print Job Submitted!</h3>
        <a href="/api/status/${id}">Check Print Job Status</a>
      `);
      },
      default: () => {
        // Fallback if the client requests something else (or send 406 Not Acceptable)
        res.type('txt').send(id);
      }
    });
  });
});

app.get('/api/status/:id', (req, res) => {
  let job = print_jobs.find(x => x.id == req.params.id);
  res.send(`
    <p>Job Status: ${SIMPLE_STATUS[job.status[0]]} (${job.status})</p>
    <img src="/uploads/${job.id}-pre.png"></img>
    <a href="">Refresh</a>
  `);
});

app.post('/api/printer/poll', (req, res) => {
  auth.printer_control_flow(req.body._key, res, () => {
    let unpolled = print_jobs.filter(x => x.status == "PNR");
    unpolled.forEach(x => x.status = "PRP");
    res.send(unpolled);
  })
});

app.post('/api/printer/update/:id', (req, res) => {
  const {_key, status} = req.body;
  auth.printer_control_flow(_key, res, () => {
    let job = print_jobs.find(x => x.id == req.params.id);
    if(job.status == "PRP" && PRP_UPDATES.includes(status)) {
      job.status = status;
      res.status(200).send({});
    } else if(job.status == "PIQ" && PIQ_UPDATES.includes(status)) {
      job.status = status;
      res.status(200).send({});
    } else {
      res.status(409).send({error: "ISU"});
    }
  });
});

app.post('/api/printer/preview/:id', express.raw({ type: 'image/png', limit: '20mb' }), (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: 'MIB' });
    }

    const p = path.join(__dirname, 'uploads', req.params.id+'-pre.png');
    fs.writeFileSync(p, req.body);

    res.json({
      bytes: req.body.length
    });
  }
);


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});