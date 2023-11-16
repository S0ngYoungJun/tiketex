const express = require('express');
const mariadb = require('mariadb');
const app = express();
const path = require('path')
const port = 3000;


app.use(express.static('public'));
app.use(express.json());


// MariaDB 연결 정보
const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'root',
  port: '3307',
  password: '723546',
  database: 'tiketing',
  connectionLimit: 10,
  acquireTimeout: 10000,
});

app.listen(port, async () => {
  console.log(`Server is running at http://localhost:${port}`);

  const connection = await pool.getConnection();
  try {
    await connection.query('DROP TABLE IF EXISTS tickets');
    await connection.query('DROP TABLE IF EXISTS cart');
    await connection.query(`
      CREATE TABLE tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seat CHAR(10) NOT NULL,
        price INT NOT NULL,
        status ENUM('available', 'reserved') DEFAULT 'available'
      )
    `);

    await connection.query(`
      CREATE TABLE cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seat CHAR(10) NOT NULL,
        price INT NOT NULL
      )
    `);

    // 좌석 배치
    const seatLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    const seatPrices = {
      'f': 15,
      'g': 15,
      'h': 15,
      default: 10,
    };

    for (let letter of seatLetters) {
      const price = seatPrices[letter] || seatPrices.default;
      for (let i = 1; i <= 10; i++) {
        await connection.query(`INSERT INTO tickets (seat, price) VALUES (?, ?)`, [`${letter}${i}`, price]);
      }
    }

    console.log('Ticket table created and initialized.');
  } catch (error) {
    console.error('Error initializing tickets:', error);
  } finally {
    connection.release();
  }
});

app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/api/tickets', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const tickets = await connection.query('SELECT * FROM tickets');
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching tickets.' });
  } finally {
    connection.release();
  }
});
// 좌석 예약 API
app.post('/api/add-to-cart', async (req, res) => {
  const { seatId } = req.body;

  const connection = await pool.getConnection();
  try {
    // 티켓 확인 및 예약 상태 확인
    const [ticket] = await connection.query('SELECT * FROM tickets WHERE seat = ? AND status = ?', [seatId, 'available']);

    if (ticket) {
      // 예약된 좌석으로 상태 업데이트
      await connection.query('UPDATE tickets SET status = ? WHERE id = ?', ['reserved', ticket.id]);

      // 카트에 추가
      await connection.query('INSERT INTO cart (seat, price) VALUES (?, ?)', [seatId, ticket.price]);

      res.json({ success: true, message: 'Seat added to cart.' });
    } else {
      res.json({ success: false, message: 'Seat not available for reservation.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error adding seat to cart.' });
  } finally {
    connection.release();
  }
});

// 좌석을 장바구니에서 제거
app.post('/api/remove-from-cart', async (req, res) => {
  const { seatId } = req.body;

  const connection = await pool.getConnection();
  try {
    // 티켓 확인 및 예약 상태 확인
    const [ticket] = await connection.query('SELECT * FROM cart WHERE seat = ?', [seatId]);

    if (ticket) {
      // 티켓을 예약 가능한 상태로 업데이트
      await connection.query('UPDATE tickets SET status = ? WHERE seat = ?', ['available', seatId]);

      // 카트에서 제거
      await connection.query('DELETE FROM cart WHERE seat = ?', [seatId]);

      res.json({ success: true, message: 'Seat removed from cart.' });
    } else {
      res.json({ success: false, message: 'Seat not found in cart.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error removing seat from cart.' });
  } finally {
    connection.release();
  }
});

