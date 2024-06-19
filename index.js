const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const todoRoutes = require("./routes/todos");
const moment = require("moment");
const soment = require("moment-timezone");
require("dotenv").config();
const schedule = require("node-schedule");
const { default: axios } = require("axios");
const mysql = require("mysql");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200,
  },
});

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.use("/api/v1", todoRoutes);

// Create the connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.HOST,
  user: process.env.USER,
  password: "S1s5h71k#",
  database: process.env.DATABASE_URL,
  multipleStatements: true,
  connectTimeout: 10000,
});

// Event listener for new connections
pool.on("connection", function (_conn) {
  if (_conn) {
    console.log(`Connected to the database via threadId ${_conn.threadId}!!`);
    _conn.query("SET SESSION auto_increment_increment=1");
  }
});

// Function to insert data into trxonetable
function insertIntoTrxonetable(time, obj, callback) {
  const newString = obj.hash;
  let num = null;
  for (let i = newString.length - 1; i >= 0; i--) {
    if (!isNaN(parseInt(newString[i]))) {
      num = parseInt(newString[i]);
      break;
    }
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting database connection: ", err);
      return callback(err);
    }
    let timee = moment(time).format("HH:mm:ss");
    let hash = `**${obj.hash.slice(-4)}`;
    let overall = JSON.stringify(obj);
    let trdigit = `${obj.hash.slice(-5)}`;
    let tr_number = obj.number;
    // Create the insert query
    // const sql =
    //   "INSERT INTO tr42_win_slot (tr09_req_recipt) VALUES (?)"; // Adjust the columns and values as per your table structure

    // Execute the query
    const query_id =
      "SELECT tr_tranaction_id,tr_price FROM tr_game WHERE tr_id = 1";
    connection.query(query_id, (error, results) => {
      const sqlupdatequery = `UPDATE tr_game SET tr_tranaction_id = ${
        Number(results?.[0]?.tr_tranaction_id) + 1
      }, tr_price = ${Number(results?.[0]?.tr_price) + 1} WHERE tr_id = 1`;
      connection.query(sqlupdatequery, (error, res) => {
        if (error) {
          console.error("Error executing query: ", error);
          // return callback(error);
        }
      });
      const sql =
        "INSERT INTO tr42_win_slot (tr41_slot_id, tr_block_time, tr41_packtype,tr_transaction_id,tr_price,tr_hashno,tr_overall_hash,tr_digits,tr_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"; // Adjust the columns and values as per your table structure
      const sql43 =
        "INSERT INTO tr43_win_slot (tr41_slot_id, tr_block_time, tr41_packtype,tr_transaction_id,tr_price,tr_hashno,tr_overall_hash,tr_digits,tr_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"; // Adjust the columns and values as per your table structure

      connection.query(
        sql43,
        [
          num + 1,
          timee,
          1,
          Number(results?.[0]?.tr_tranaction_id) + 1,
          Number(results?.[0]?.tr_price) + 1,
          hash,
          overall,
          trdigit,
          tr_number,
        ],
        (error, res) => {
          if (error) console.log(err);
        }
      );
      // Release the connection back to the pool
      connection.query(
        sql,
        [
          num + 1,
          timee,
          1,
          Number(results?.[0]?.tr_tranaction_id) + 1,
          Number(results?.[0]?.tr_price) + 1,
          hash,
          overall,
          trdigit,
          tr_number,
        ],
        (error, result) => {
          if (error) {
            console.error("Error executing query: ", error);
            return callback(error);
          }
        }
      );

      connection.release();

      // Return the results via the callback
      callback(null, results);
    });
  });
}

// color prediction game time generated every 1 min
function generatedTimeEveryAfterEveryOneMin() {
  const job = schedule.scheduleJob("* * * * * *", async function () {
    const currentTime = new Date();
    const timeToSend =
      currentTime.getSeconds() > 0
        ? 60 - currentTime.getSeconds()
        : currentTime.getSeconds();
    io.emit("onemin", timeToSend); // Emit the formatted time
    if (timeToSend === 0) {
      try {
        const res = await axios.get(
          "https://admin.zupeeter.com/api/resultonemin"
        );
      } catch (e) {
        console.log(e);
      }
    }
  });
}

// color prediction game time generated every 3 min
const generatedTimeEveryAfterEveryThreeMin = () => {
  let min = 2;

  const job = schedule.scheduleJob("* * * * * *", async function () {
    const currentTime = new Date().getSeconds(); // Get the current time
    const timeToSend = currentTime > 0 ? 60 - currentTime : currentTime;
    io.emit("threemin", `${min}_${timeToSend}`);
    if (currentTime === 0) {
      min--;
      if (min < 0) {
        try {
          const res = await axios.get(
            "https://admin.zupeeter.com/api/resultthreemin"
          );
        } catch (e) {
          console.log(e);
        }
        min = 2; // Reset min to 2 when it reaches 0
      }
    }
  });
};

const generatedTimeEveryAfterEveryFiveMin = () => {
  let min = 4;

  const job = schedule.scheduleJob("* * * * * *", async function () {
    const currentTime = new Date().getSeconds(); // Get the current time
    const timeToSend = currentTime > 0 ? 60 - currentTime : currentTime;
    io.emit("fivemin", `${min}_${timeToSend}`);
    if (currentTime === 0) {
      min--;
      if (min < 0) {
        try {
          const res = await axios.get(
            "https://admin.zupeeter.com/api/resultfivemin"
          );
        } catch (e) {
          console.log(e);
        }
        min = 4; // Reset min to 2 when it reaches 0
      }
    }
    if (timeToSend === 0) {
    }
  });
};

let twoMinTrxJob;
let threeMinTrxJob;

// TRX
// color prediction game time generated every 1 min
function generatedTimeEveryAfterEveryOneMinTRX() {
  let isAlreadyHit = "";
  let result = "";
  const rule = new schedule.RecurrenceRule();
  rule.second = new schedule.Range(0, 59);
  const job = schedule.scheduleJob(rule, function () {
    const currentTime = new Date();
    const timeToSend =
      currentTime.getSeconds() > 0
        ? 60 - currentTime.getSeconds()
        : currentTime.getSeconds();
    io.emit("onemintrx", timeToSend);
    if (timeToSend === 0) io.emit("result", result);
    if (timeToSend === 9) {
      const datetoAPISend = parseInt(new Date().getTime().toString());
      const actualtome = soment.tz("Asia/Kolkata");
      const time = actualtome.add(5, "hours").add(30, "minutes").valueOf();

      try {
        setTimeout(async () => {
          const res = await axios.get(
            `https://apilist.tronscanapi.com/api/block?sort=-balance&start=0&limit=20&producer=&number=&start_timestamp=${datetoAPISend}&end_timestamp=${datetoAPISend}`
          );
          if (res?.data?.data[0]) {
            const obj = res.data.data[0];
            const fd = new FormData();
            fd.append("hash", `**${obj.hash.slice(-4)}`);
            fd.append("digits", `${obj.hash.slice(-5)}`);
            fd.append("number", obj.number);
            fd.append("time", moment(time).format("HH:mm:ss"));
            let prevalue = `${moment(time).format("HH:mm:ss")}`;
            const newString = obj.hash;
            let num = null;
            for (let i = newString.length - 1; i >= 0; i--) {
              if (!isNaN(parseInt(newString[i]))) {
                num = parseInt(newString[i]);
                break;
              }
            }
            fd.append("slotid", num);
            fd.append("overall", JSON.stringify(obj));
            //  trx 1
            console.log(num,moment(time).format("HH:mm:ss"),"result");
            try {
              if (String(isAlreadyHit) === String(prevalue)) return;
              // const response = await axios.post(
              //   "https://admin.zupeeter.com/Apitrx/insert_one_trx",
              //   fd
              // );
              const newString = obj.hash;
              let num = null;
              for (let i = newString.length - 1; i >= 0; i--) {
                if (!isNaN(parseInt(newString[i]))) {
                  num = parseInt(newString[i]);
                  break;
                }
              }
              result = num + 1;
              insertIntoTrxonetable(time, obj, (err, results) => {
                if (err) {
                  console.error("Error inserting data: ", err);
                } else {
                  console.log("Data inserted successfully: ", results);
                }
              });
              isAlreadyHit = prevalue;
            } catch (e) {
              console.log(e);
            }
          }
        }, [4000]);
      } catch (e) {
        console.log(e);
      }
    }
  });
}

// function generatedTimeEveryAfterEveryOneMinTRX() {
//   let isAlreadyHit = "";
//   setInterval(() => {
//     const currentTime = new Date();
// const timeToSend =
//   currentTime.getSeconds() > 0
//     ? 60 - currentTime.getSeconds()
//     : currentTime.getSeconds();
// io.emit("onemintrx", timeToSend);
// if (timeToSend === 6) {

//   const datetoAPISend = parseInt(new Date().getTime().toString());
//   const actualtome = soment.tz("Asia/Kolkata");
//   const time = actualtome.add(5, "hours").add(30, "minutes").valueOf();
//   // console.log("inside the if block",moment(time).format("HH:mm:ss"));
//   try {
//     setTimeout(async () => {
//       const res = await axios.get(
//         `https://apilist.tronscanapi.com/api/block?sort=-balance&start=0&limit=20&producer=&number=&start_timestamp=${datetoAPISend}&end_timestamp=${datetoAPISend}`
//       );
//       if (res?.data?.data[0]) {

//         const obj = res.data.data[0];
//         const fd = new FormData();
//         fd.append("hash", `**${obj.hash.slice(-4)}`);
//         fd.append("digits", `${obj.hash.slice(-5)}`);
//         fd.append("number", obj.number);
//         fd.append("time", moment(time).format("HH:mm:ss"));
//         let prevalue = `${moment(time).format("HH:mm:ss")}`;
//         const newString = obj.hash;
//         let num = null;
//         for (let i = newString.length - 1; i >= 0; i--) {
//           if (!isNaN(parseInt(newString[i]))) {
//             num = parseInt(newString[i]);
//             break;
//           }
//         }
//         fd.append("slotid", num);
//         fd.append("overall", JSON.stringify(obj));
//         //  trx 1
//         try {
//            if (String(isAlreadyHit) === String(prevalue)) return;
//            io.emit("onemintrxdata", obj);
//           // const response = await axios.post(
//           //   "https://admin.zupeeter.com/Apitrx/insert_one_trx",
//           //   fd
//           // );
//               isAlreadyHit = prevalue;

//         } catch (e) {
//           console.log(e);
//         }
//       }
//     }, [6000]);
//   } catch (e) {
//     console.log(e);
//   }
// }
// }, 1000);
// }

// generatedTimeEveryAfterEveryOneMinTRX();

const generatedTimeEveryAfterEveryThreeMinTRX = () => {
  let min = 2;
  twoMinTrxJob = schedule.scheduleJob("* * * * * *", function () {
    const currentTime = new Date().getSeconds(); // Get the current time
    const timeToSend = currentTime > 0 ? 60 - currentTime : currentTime;
    io.emit("threemintrx", `${min}_${timeToSend}`);
    // if (min === 0 && timeToSend === 6) {
    //   const datetoAPISend = parseInt(new Date().getTime().toString());
    //   const actualtome = soment.tz("Asia/Kolkata");
    //   const time = actualtome.add(5, "hours").add(30, "minutes").valueOf();
    //   try {
    //     setTimeout(async () => {
    //       const res = await axios.get(
    //         `https://apilist.tronscanapi.com/api/block?sort=-balance&start=0&limit=20&producer=&number=&start_timestamp=${datetoAPISend}&end_timestamp=${datetoAPISend}`
    //       );
    //       if (res?.data?.data[0]) {
    //         const obj = res.data.data[0];
    //         const fd = new FormData();
    //         fd.append("hash", `**${obj.hash.slice(-4)}`);
    //         fd.append("digits", `${obj.hash.slice(-5)}`);
    //         fd.append("number", obj.number);
    //         fd.append("time", moment(time).format("HH:mm:ss"));
    //         const newString = obj.hash;
    //         let num = null;
    //         for (let i = newString.length - 1; i >= 0; i--) {
    //           if (!isNaN(parseInt(newString[i]))) {
    //             num = parseInt(newString[i]);
    //             break;
    //           }
    //         }
    //         fd.append("slotid", num);
    //         fd.append("overall", JSON.stringify(obj));
    //         //  trx 3
    //         try {
    //           console.log("functoin call for 3 min");
    //           const response = await axios.post(
    //             "https://admin.zupeeter.com/Apitrx/insert_three_trx",
    //             fd
    //           );
    //         } catch (e) {
    //           console.log(e);
    //         }
    //       }
    //     }, [6000]);
    //   } catch (e) {
    //     console.log(e);
    //   }
    // }
    if (currentTime === 0) {
      min--;
      if (min < 0) min = 2; // Reset min to 2 when it reaches 0
    }
  });
};

const generatedTimeEveryAfterEveryFiveMinTRX = () => {
  let min = 4;
  threeMinTrxJob = schedule.scheduleJob("* * * * * *", function () {
    const currentTime = new Date().getSeconds(); // Get the current time
    const timeToSend = currentTime > 0 ? 60 - currentTime : currentTime;
    io.emit("fivemintrx", `${min}_${timeToSend}`);
    // if (min === 0 && timeToSend === 6) {
    //   const datetoAPISend = parseInt(new Date().getTime().toString());
    //   const actualtome = soment.tz("Asia/Kolkata");
    //   const time = actualtome.add(5, "hours").add(30, "minutes").valueOf();
    //   try {
    //     setTimeout(async () => {
    //       const res = await axios.get(
    //         `https://apilist.tronscanapi.com/api/block?sort=-balance&start=0&limit=20&producer=&number=&start_timestamp=${datetoAPISend}&end_timestamp=${datetoAPISend}`
    //       );
    //       if (res?.data?.data[0]) {
    //         const obj = res.data.data[0];
    //         const fd = new FormData();
    //         fd.append("hash", `**${obj.hash.slice(-4)}`);
    //         fd.append("digits", `${obj.hash.slice(-5)}`);
    //         fd.append("number", obj.number);
    //         fd.append("time", moment(time).format("HH:mm:ss"));
    //         const newString = obj.hash;
    //         let num = null;
    //         for (let i = newString.length - 1; i >= 0; i--) {
    //           if (!isNaN(parseInt(newString[i]))) {
    //             num = parseInt(newString[i]);
    //             break;
    //           }
    //         }
    //         fd.append("slotid", num);
    //         fd.append("overall", JSON.stringify(obj));
    //         //  trx 3
    //         try {
    //           console.log("functoin call for 5 min");
    //           const response = await axios.post(
    //             "https://admin.zupeeter.com/Apitrx/insert_five_trx",
    //             fd
    //           );
    //         } catch (e) {
    //           console.log(e);
    //         }
    //       }
    //     }, [6000]);
    //   } catch (e) {
    //     console.log(e);
    //   }
    // }
    if (currentTime === 0) {
      min--;
      if (min < 0) min = 4; // Reset min to 4 when it reaches 0
    }
  });
};

io.on("connection", (socket) => {});

let x = true;
let trx = true;

// console.log(time,moment(time).format("HH:mm:ss"))
// if (trx) {
//   const now = new Date();
//   const nowIST = soment(now).tz("Asia/Kolkata");
//   // const fiveHoursThirtyMinutesLater = nowIST.clone().add(5, 'hours').add(30, 'minutes');

//   const currentMinute = nowIST.minutes();
//   const currentSecond = nowIST.seconds();

//   // Calculate remaining minutes and seconds until 22:28 IST
//   const minutesRemaining = 15 - currentMinute - 1;
//   const secondsRemaining = 60 - currentSecond;

//   const delay = (minutesRemaining * 60 + secondsRemaining) * 1000;
//   console.log(minutesRemaining, secondsRemaining, delay);

//   setTimeout(() => {
//     generatedTimeEveryAfterEveryOneMinTRX();
//     generatedTimeEveryAfterEveryThreeMinTRX();
//     generatedTimeEveryAfterEveryFiveMinTRX();
//     trx = false;
//   }, delay);
// }

if (x) {
  // generateAndSendMessage();
  console.log("Waiting for the next minute to start...");
  const now = new Date();
  const secondsUntilNextMinute = 60 - now.getSeconds();
  console.log(
    "start after ",
    moment(new Date()).format("HH:mm:ss"),
    secondsUntilNextMinute
  );

  setTimeout(() => {
    generatedTimeEveryAfterEveryOneMinTRX();
    generatedTimeEveryAfterEveryOneMin();
    generatedTimeEveryAfterEveryThreeMin();
    generatedTimeEveryAfterEveryFiveMin();
    x = false;
  }, secondsUntilNextMinute * 1000);
}

const finalRescheduleJob = schedule.scheduleJob(
  "15,30,45,0 * * * *",
  function () {
    twoMinTrxJob?.cancel();
    threeMinTrxJob?.cancel();
    generatedTimeEveryAfterEveryThreeMinTRX();
    generatedTimeEveryAfterEveryFiveMinTRX();
  }
);

app.get("/", (req, res) => {
  res.send(`<h1>server running at port=====> ${PORT}</h1>`);
});

httpServer.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});