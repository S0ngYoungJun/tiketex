// 페이지 로딩 시 좌석 정보 가져오기
fetch('/api/tickets')
  .then(response => response.json())
  .then(tickets => {
    // 좌석 표시 및 이벤트 핸들러 추가
    const seatsContainer = document.getElementById('seats');

    // 좌석 배치
    const seatLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

    seatLetters.forEach(letter => {
      const row = document.createElement('div');
      row.classList.add('seat-row');

      for (let i = 1; i <= 10; i++) {
        const seatNumber = i;
        const seatId = `${letter}${seatNumber}`;
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.dataset.seat = seatId;

        // 티켓 상태에 따라서 UI 업데이트 (예약된 좌석 등)
        const isReserved = tickets.some(ticket => ticket.seat === seatId && ticket.status === 'reserved');
        seat.classList.toggle('reserved', isReserved);

        seat.textContent = seatId;

        row.appendChild(seat);
      }

      seatsContainer.appendChild(row);
    });
  })
  .catch(error => console.error('Error fetching tickets:', error));

// 예약 버튼 클릭 시
const seatsContainer = document.getElementById('seats')

seatsContainer.addEventListener('click', async function (event) {
  if (event.target.classList.contains('seat') && !event.target.classList.contains('reserved')) {
    const seat = event.target.dataset.seat;

    try {
      const response = await fetch('/api/reserve-seats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSeats: [seat],
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 카트 업데이트 로직 추가
        const cartItems = document.getElementById('cart-items');
        const cartItem = document.createElement('li');
        cartItem.textContent = `Seat ${seat} - $${data.totalPrice}`;
        cartItems.appendChild(cartItem);

        // 좌석 UI 업데이트
        event.target.classList.add('reserved');
        console.log(`Selected Seat: ${seat}, Total Price: $${data.totalPrice}`);
      } else {
        console.error('Error reserving seat:', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
});