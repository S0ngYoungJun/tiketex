document.addEventListener('DOMContentLoaded', async () => {
  const orderItems = document.getElementById('order-items');
  const totalPriceElement = document.getElementById('total-price');
  const paymentBtn = document.getElementById('payment-btn');

  // URL 파라미터에서 카트 정보 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const cartDataParam = urlParams.get('cart');
  const cartItems = cartDataParam ? JSON.parse(decodeURIComponent(cartDataParam)) : [];

  // 카트에 담은 좌석 티켓 정보 및 영수증 업데이트
  function updateOrderDetails() {
    orderItems.innerHTML = '';
    let totalPrice = 0;

    cartItems.forEach(item => {
      const orderItem = document.createElement('li');
      orderItem.textContent = `Seat ${item.seat} - $${item.price}`;
      orderItems.appendChild(orderItem);

      totalPrice += item.price;
    });

    totalPriceElement.textContent = `Total Price: $${totalPrice}`;
  }

  // 페이지 로딩 시 카트 정보로 영수증 업데이트
  updateOrderDetails();

  // 결제 버튼 클릭 시
  paymentBtn.addEventListener('click', () => {
    // 여기에 실제 결제 처리 로직을 추가하면 됩니다.
    alert(`Total Price: ${totalPriceElement.textContent}\nPayment processing...`);

    // 결제 완료 후 서버에서 카트 비우기
    fetch('/api/checkout', {
      method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Payment successful! Your order has been confirmed.');
        // 여기에 결제 완료 후 사용자에게 보여줄 내용을 추가하면 됩니다.
      } else {
        alert('Payment failed. Please try again.');
      }
    })
    .catch(error => console.error('Error during checkout:', error));
  });
});