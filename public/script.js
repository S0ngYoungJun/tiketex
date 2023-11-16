document.addEventListener('DOMContentLoaded', async () => {
  // 페이지 로딩 시 좌석 정보 가져오기
  const tickets = await fetch('/api/tickets').then(response => response.json());

  const seatsContainer = document.getElementById('seats');
  const cartItems = document.getElementById('cart-items');
  const totalPriceElement = document.getElementById('total-price');
  const checkoutBtn = document.getElementById('checkout-btn');

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

      seat.addEventListener('click', () => handleSeatClick(seatId));

      row.appendChild(seat);
    }

    seatsContainer.appendChild(row);
  });

  // 좌석 예약 처리
  function handleSeatClick(seatId) {
    const seatElement = document.querySelector(`[data-seat="${seatId}"]`);

    if (seatElement.classList.contains('reserved')) {
      alert('이미 예약된 좌석입니다.');
      return;
    }

    seatElement.classList.toggle('selected');
    const isSelected = seatElement.classList.contains('selected');
    seatElement.style.backgroundColor = isSelected ? 'orange' : ''; 

    updateCart();
    if (isSelected) {
      addToCart(seatId);
    } else {
      removeFromCart(seatId);
    }
  }
  
  // 장바구니에 좌석 추가
  async function addToCart(seatId) {
    const response = await fetch('/api/add-to-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seatId,
      }),
    });
  
    const data = await response.json();
  
    if (!data.success) {
      console.error('Error adding seat to cart:', data.message);
    }
  }
  
  // 장바구니에서 좌석 제거
  async function removeFromCart(seatId) {
    const response = await fetch('/api/remove-from-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seatId,
      }),
    });
  
    const data = await response.json();
  
    if (!data.success) {
      console.error('Error removing seat from cart:', data.message);
    }
  
  }

  // 장바구니 업데이트
  function updateCart() {
    const selectedSeats = Array.from(document.querySelectorAll('.seat.selected')).map(seat => seat.dataset.seat);
    const selectedTickets = tickets.filter(ticket => selectedSeats.includes(ticket.seat));

    // 카트 업데이트
    cartItems.innerHTML = '';
    let totalPrice = 0;

    selectedTickets.forEach(ticket => {
      const cartItem = document.createElement('li');
      cartItem.textContent = `Seat ${ticket.seat} - $${ticket.price}`;
      cartItems.appendChild(cartItem);

      totalPrice += ticket.price;
    });

    totalPriceElement.textContent = `Total Price: $${totalPrice}`;
  }

  checkoutBtn.addEventListener('click', async() => {
    const selectedSeats = Array.from(document.querySelectorAll('.seat.selected')).map(seat => seat.dataset.seat);
    if (selectedSeats.length === 0) {
    alert('장바구니가 비어 있습니다. 좌석을 선택해주세요.');
    return;
  }
  // 서버에 현재 카트에 담긴 티켓 정보를 요청
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selectedSeats,
    }),
  });
  const cartData = await response.json();

  // 응답으로 받은 카트 정보를 사용하여 URL을 생성
  const orderUrl = `/order.html?cart=${encodeURIComponent(JSON.stringify(cartData))}`;
  window.location.href = orderUrl;
  });
});