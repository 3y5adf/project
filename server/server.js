const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

const app = express();
app.use(cors());

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); // .은 경로

const config = {
  user: 'SYSTEM',
  password: 'test1234',
  connectString: 'localhost:1521/xe'
};

// Oracle 데이터베이스와 연결을 유지하기 위한 전역 변수
let connection;

// 데이터베이스 연결 설정
async function initializeDatabase() {
  try {
    connection = await oracledb.getConnection(config);
    console.log('Successfully connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle database', err);
  }
}

initializeDatabase();

// 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/stu/list', async (req, res) => {
  const { } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM STUDENT`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        list : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/stu/insert', async (req, res) => {
  const { stuNo, name, dept } = req.query;

  try {
    await connection.execute(
      `INSERT INTO STUDENT (STU_NO, STU_NAME, STU_DEPT) VALUES (:stuNo, :name, :dept)`,
      [stuNo, name, dept],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/member/loginUser', async (req, res) => {
  const {userId } = req.query;
  console.log(userId);
  let query = `WHERE ID = '${userId}'`
  console.log(query);
  try {
    const result = await connection.execute(`SELECT * FROM PR_MEMBER `+query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        list : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/member/login', async (req, res) => {
  const { userId, userPwd } = req.query;
  let query = `SELECT * FROM PR_MEMBER WHERE ID = '${userId}' AND PASSWORD = '${userPwd}'`
  console.log(query);
  try {
    const result = await connection.execute(query) ;
    const columnNames = result.metaData.map(column => column.name);

    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/member/view', async (req, res) => {
  const { memberNum } = req.query;
  let query = `WHERE MEMBER_NUM = ${memberNum}`
  // console.log(query);
  try {
    const result = await connection.execute(`SELECT mb.*,to_char(birth, 'YYYY-MM-DD') AS FORMATTED_BIRTH, STATUS FROM PR_MEMBER MB INNER JOIN PR_STATUS S ON MB.STATUS_CODE=S.STATUS_CODE `+query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        list : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/member/list', async (req, res) => {
  const { offset, pageSize } = req.query;
  try {
    const result = await connection.execute(
      `SELECT M.*, TO_CHAR(BIRTH, 'YYYY-MM-DD') AS BIRTHDAY, STATUS FROM PR_MEMBER M `
    + `INNER JOIN PR_STATUS S `
    + `ON M.STATUS_CODE = S.STATUS_CODE `
    + `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`
    );
    
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    
    const count = await connection.execute(
      `SELECT COUNT(*) FROM PR_MEMBER`
    );


    res.json({
        result : "success",
        list : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/member/signUp', async (req, res) => {
  const { userName, userBirth, userPhone, userEmail, userId, userPwd, userNickname } = req.query;

  console.log(userName);
  // console.log(userGenre);

  let query=
    `INSERT INTO PR_MEMBER(MEMBER_NUM, MEMBER_NAME, BIRTH, PHONE, EMAIL, ID, PASSWORD, NICKNAME, STATUS_CODE) `
  + `VALUES (PR_M_SEQ.NEXTVAL, :userName, TO_DATE(:userBirth, 'YYYYMMDD'), :userPhone, :userEmail, :userId, :userPwd, :userNickname, 9) `;
  // + `RETURNING MEMBER_NUM INTO :membernum`;
  
  console.log(query);

  try {
    await connection.execute(
      query,
    
      [userName, userBirth, userPhone, userEmail, userId, userPwd, userNickname],
      { autoCommit: true }
    );
  
  console.log(userName)
  console.log(userBirth)
  console.log(userPhone)
  console.log(userEmail)
  console.log(userId)
  console.log(userPwd)
  console.log(userNickname)
    

    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/genre/list', async (req, res) => {
  const { } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM PR_GENRE`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        genreList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/category/list', async (req, res) => {
  const { } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM PR_CATEGORY`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        categoryList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/country/list', async (req, res) => {
  const { } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM PR_COUNTRY`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        countryList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/translated/list', async (req, res) => {
  const { } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM PR_TRANSLATED`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        translatedList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/type/list', async (req, res) => {
  const { } = req.query;
  try {
    const result = await connection.execute(`SELECT * FROM PR_TYPE`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        typeList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/search', async (req, res) => {
  const { genreCheck, countryCheck, categoryCheck, translatedCheck, typeCheck } = req.query;
  let query = `WHERE MEMBER_NUM = ${memberNum}`
  console.log(genreCheck);
  try {
    const result = await connection.execute(`SELECT * FROM PR_MEMBER `+query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        list : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/status/list', async (req, res) => {
  const { memberStatus } = req.query;

  try {
    const result = await connection.execute(`SELECT * FROM PR_STATUS `);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        statusList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/status/codeSearch', async (req, res) => {
  const { memberStatus } = req.query;
  
  try {
    const result = await connection.execute(`SELECT * FROM PR_STATUS WHERE STATUS = '` + memberStatus + `'`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        statusList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/status/edit', async (req, res) => {
  const { statusCode, memberNum } = req.query;
    // self.info를 파라미터로 받아서 들어오는 값들
  try {
    await connection.execute(
      `UPDATE PR_MEMBER SET STATUS_CODE = :statusCode WHERE MEMBER_NUM = :memberNum`,
      [ statusCode, memberNum],
        //  :로 참조 가능하게 해줌
        // 쿼리의 순서와 값의 순서가 같아야 함
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/board/memberSearch', async (req, res) => {
  const { memberId } = req.query;
  
  try {
    const result = await connection.execute(`SELECT * FROM PR_MEMBER WHERE ID = '` + memberId + `'`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        memberList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/boardKind/list', async (req, res) => {
  const {  } = req.query;
  
  try {
    const result = await connection.execute(`SELECT * FROM PR_BOARD_KIND`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        kindList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/boardKind/code', async (req, res) => {
  const { kindPick } = req.query;
  
  try {
    const result = await connection.execute(`SELECT * FROM PR_BOARD_KIND WHERE BOARD_KIND = '` + kindPick + `'`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        kindPick : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/board/insert', async (req, res) => {
  const { kindCode, boardTitle, boardContents, memberNickname, memberId } = req.query;

  try {
    await connection.execute(
      `INSERT INTO PR_BOARD(BOARD_NUM, BOARD_TITLE, ID, NICKNAME, BOARD_CODE, BOARD_CONTENTS, BOARD_LIKES, VIEWCNT, CTIME, UTIME, COMMENT_CNT, BOARD_STATUS_CODE) `
    + `VALUES(PR_BOARD_SEQ.NEXTVAL, :boardTitle, :memberId, `
    + `:memberNickname, :kindCode, :boardContents, 0, 0, SYSDATE, SYSDATE, 0, 1)`,
      [boardTitle, memberId, memberNickname, kindCode, boardContents,],
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/board/list', async (req, res) => {
  const { boardNum } = req.query;
  let query = ``;
  // console.log(boardNum);
  if(boardNum != null || boardNum != undefined){
    query = `WHERE BOARD_NUM = ` + boardNum + ` `;
    // console.log(query);
  }
  
  try {
    const result = await connection.execute(
      `SELECT * FROM PR_BOARD PB `
    + `INNER JOIN PR_BOARD_KIND PBK `
    + `ON PB.BOARD_CODE = PBK.BOARD_CODE `
    +  query
    + `ORDER BY BOARD_NUM DESC`);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        boardList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/work/list', async (req, res) => {
  const { typeNum, offset, pageSize } = req.query;
  /*
  typeNum
  0=전체 작품
  1=서적
  2=e북
  3=웹툰
  4=웹소설
  */
  let query = "";
  if(typeNum == 0){
    query = "";
  }
  if(typeNum == 1){
    query = `WHERE TYPE_NUM = 1 `;
  }
  if(typeNum == 2){
    query = `WHERE TYPE_NUM = 2 `;
  }
  if(typeNum == 3){
    query = `WHERE TYPE_NUM = 3 `;
  }
  if(typeNum == 4){
    query = `WHERE TYPE_NUM = 4 `;
  }

  try {
    const result = await connection.execute(
      `SELECT * `
    + `FROM PR_WORK PWK `
    + `LEFT JOIN PR_CATEGORY PCG `
    + `ON PWK.CATEGORY_NUM = PCG.CATEGORY_NUM `
    + `LEFT JOIN PR_WRITER PWR `
    + `ON PWK.WRITER_NUM = PWR.WRITER_NUM `
    + `LEFT JOIN PR_PUBLISHER PP `
    + `ON PWK.PUBLISHER_NUM = PP.PUBLISHER_NUM `
    + `LEFT JOIN PR_COUNTRY PCT `
    + `ON PWK.COUNTRY_NUM = PCT.COUNTRY_NUM `
    + `LEFT JOIN PR_TRANSLATED PTS `
    + `ON PWK.TRANSLATED_CODE = PTS.TRANSLATED_CODE `
    +  query
    + `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`
    );
    console.log(result);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    
    const count = await connection.execute(
      `SELECT COUNT(*) FROM PR_WORK ` + query
    );


    res.json({
        result : "success",
        list : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/fav/list', async (req, res) => {
  const { memberNum } = req.query;
  try {
    const result = await connection.execute(
       `SELECT * FROM PR_FAV PF `
      +`INNER JOIN PR_GENRE PG `
      +`ON PF.GENRE_NUM = PG.GENRE_NUM `
      +`WHERE MEMBER_NUM = ${memberNum}`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        favList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/workSearch/list', async (req, res) => {
  const { genreS, categoryS, countryS, translatedS, typeS } = req.query;
  // let genreSar = Object.values(genreS);
  // console.log(genreSar);
  let query = ``;
  // console.log(boardNum);
  if(
    genreS.length>0 || categoryS.length>0 
    || countryS.length>0 || translatedS.length>0 || typeS.length>0
  ){
    query = `WHERE `;

      if(genreS.length>0){
        for(let i=0;i<genreS.length;i++){
          if(i === genreS.length-1){
            query += `GENRE_NAME LIKE '%${genreS[i]}%') `;
          } else {
            query += `(GENRE_NAME LIKE '%${genreS[i]}%' OR `;
          }
        }
      }

      if(categoryS.length>0){
        if(genreS.length>0){
          query += `AND `
        }
        for(let i=0;i<categoryS.length;i++){
          if(i === categoryS.length-1){
            query += `CATEGORY_NAME LIKE '%${categoryS[i]}%') `;
          } else {
            query += `(CATEGORY_NAME LIKE '%${categoryS[i]}%' OR `;
          }
        }
      }

      query += `AND COUNTRY_NAME LIKE '%${countryS}%' `; 
      query += `AND TRANSLATED_STATUS LIKE '%${translatedS}%' `; 
      query += `AND TYPE_NAME LIKE '%${typeS}%'`;
  }
  
  //추가 보완 필요
  try {
    const result = await connection.execute(
      `SELECT * `
    + `FROM PR_WORK PW `
    + `LEFT JOIN PR_COUNTRY PC `
    + `ON PW.COUNTRY_NUM = PC.COUNTRY_NUM `
    + `LEFT JOIN PR_WRITER PWT `
    + `ON PW.WRITER_NUM = PWT.WRITER_NUM `
    + `LEFT JOIN PR_PUBLISHER PP `
    + `ON PW.PUBLISHER_NUM = PP.PUBLISHER_NUM `
    + `LEFT JOIN PR_TRANSLATED PTS `
    + `ON PW.TRANSLATED_CODE = PTS.TRANSLATED_CODE `
    + `LEFT JOIN PR_TYPE PT `
    + `ON PW.TYPE_NUM = PT.TYPE_NUM `
    + `LEFT JOIN PR_CATEGORY PCG `
    + `ON PW.CATEGORY_NUM = PC.CATEGORY_NUM `
    +  query
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json({
        result : "success",
        searchResult : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});




// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});
