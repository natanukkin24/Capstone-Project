import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Shop.css";

const Shop = () => {
  const [gold, setGold] = useState(0);
  const [alertMsg, setAlertMsg] = useState("");
  const navigate = useNavigate();

  const handleBuy = (price, itemName) => {
    if (gold >= price) {
      setGold(gold - price);
      setAlertMsg(`${itemName} purchased!`);
    } else {
      setAlertMsg(`Not enough gold for ${itemName}.`);
    }

    setTimeout(() => setAlertMsg(""), 2000);
  };

  return (
    <div className="shop-page">
      <div className="shop-header">
        SHOP
        <button className="close-btn" onClick={() => navigate("/student-home")}>
          ✕
        </button>
      </div>

      <div className="gold-display">GOLD: {gold} 🪙</div>

      {alertMsg && <div className="alert-box">{alertMsg}</div>}

      <div className="section">
        <div className="section-title">CHARACTER</div>
        <div className="item-list">
          <div className="shop-item">
            <img src="/Assets/dark-knight.png" alt="Dark Knight" />
            <div className="item-name">DARK KNIGHT</div>
            <div className="item-price">500 🪙</div>
            <button onClick={() => handleBuy(500, "Dark Knight")}>BUY</button>
          </div>
          <div className="shop-item">
            <img src="/Assets/zombie.png" alt="Zombie" />
            <div className="item-name">Zombie</div>
            <div className="item-price">1100 🪙</div>
            <button onClick={() => handleBuy(1100, "Zombie")}>BUY</button>
          </div>
          <div className="shop-item">
            <img src="/Assets/dracula.png" alt="Dracula" />
            <div className="item-name">Dracula</div>
            <div className="item-price">2300 🪙</div>
            <button onClick={() => handleBuy(2300, "Dracula")}>BUY</button>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">AVATAR</div>
        <div className="item-list">
          <div className="shop-item">
            <img src="/Assets/ryker.png" alt="Ryker" />
            <div className="item-name">Ryker</div>
            <div className="item-price">500 🪙</div>
            <button onClick={() => handleBuy(500, "Ryker")}>BUY</button>
          </div>
          <div className="shop-item">
            <img src="/Assets/eliza.png" alt="Eliza" />
            <div className="item-name">Eliza</div>
            <div className="item-price">1000 🪙</div>
            <button onClick={() => handleBuy(1000, "Eliza")}>BUY</button>
          </div>
          <div className="shop-item">
            <img src="/Assets/byron.png" alt="Byron" />
            <div className="item-name">Byron</div>
            <div className="item-price">800 🪙</div>
            <button onClick={() => handleBuy(800, "Byron")}>BUY</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
