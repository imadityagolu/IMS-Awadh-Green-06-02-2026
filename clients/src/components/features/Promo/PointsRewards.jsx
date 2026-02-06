import React, { useState, useEffect } from 'react'
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiUpload, FiCheck, FiChevronDown } from "react-icons/fi";
import { GrSend } from "react-icons/gr";
// import DateRangePicker from '../../componets/DateRangePicker';
import { MdAddShoppingCart } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import api from "../../../pages/config/axiosInstance";
import EmptyOcd from "../Promo/EmptyOcd";

function PointsRewards() {
  const navigate = useNavigate();

  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all active reward systems
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/reward-systems"); // ← backend mein GET route banana padega (niche diya hai)

        // Agar backend array return kare
        if (Array.isArray(res.data)) {
          setRewards(res.data);
        } else if (res.data.data) {
          setRewards(res.data.data);
        } else {
          setRewards([]);
        }
      } catch (err) {
        setError("Failed to load rewards");
        // console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const handleClick = () => {
    navigate("/createshoppingpoints");
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "No expiry";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // 🔹 CONDITIONS
  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (rewards.length === 0) return <EmptyOcd />;

  return (
    <div className='p-4'>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        {/* <div style={{
          display: 'flex',
          justifyContent:"space-between",
          alignItems: 'center',
          gap: 11,
        }}> */}

        <h2 style={{
          margin: 0,
          color: 'black',
          fontSize: 22,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          lineHeight: '26.4px',
        }}>
          Points and Rewards
        </h2>

        {/* </div> */}
        <button
          className='button-hover'
          onClick={handleClick}
          style={{
            padding: "6px 16px",
            background: "white",
            border: "1px solid #1F7FFF",
            color: "#1F7FFF",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: "14px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            height: "33px",
          }}
        >
          <MdAddShoppingCart className="fs-5" />
          <span className="fs-6">Create Point & Reward</span>
        </button>
      </div>

      {/* Loading / Error */}
      {loading && <p>Loading rewards...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Rewards List */}
      {!loading && !error && rewards.length === 0 && (
        <p>No reward systems created yet. Click "Add Shopping Points" to create one!</p>
      )}

      {/* Content Area */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {rewards.map((reward) => (
          <div
            key={reward._id}
            style={{
              position: 'relative',
              width: "394px",
              height: "170px",
              background:
                "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(178,255,0,0.12) 100%), #fff",
              overflow: "hidden",
              borderRadius: 16,
              outline: "1px solid #EAEAEA",
              padding: "16px",
              boxSizing: "border-box",
              cursor: "pointer",
            }}
          >

            {/* Header Section */}
            <div style={{ display: "flex", flexDirection: "column", }}>
              <div
                style={{
                  // width: 250,
                  left: 16,
                  height: 43,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}>
                <div
                  style={{
                    fontSize: 24,
                    color: "#0E101A",
                    fontFamily: "Inter",
                    fontWeight: 400,
                  }}
                >
                  {reward.rewardType}
                </div>
                {/* Status Badge */}
                <div
                  style={{
                    height: 25,
                    padding: "4px 8px",
                    background: reward.status === "active" ? "#D4F7C7" : "#FFE5E5",
                    borderRadius: 50,
                    color: reward.status === "active" ? "#01774B" : "#D00003",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: "#01774B",
                      fontSize: 14,
                      fontFamily: "Inter",
                    }}
                  >
                    {reward.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  width: 289,
                  fontSize: 16,
                  color: "#727681",
                  fontFamily: "Inter",
                  fontWeight: 400,
                  lineHeight: "18px",
                }}
              >
                <span style={{fontSize:'17px', fontWeight:'500', color:'#4a4b4dff'}}>{reward.offerName}</span>
                <br/>
                {reward.rewardType === "Shopping Points" && (
                  <>
                    <span>Earn upto {reward.maxEligibleAmount}% points on purchase above ₹{reward.minInvoiceValue}. Eligible after ₹{reward.minPurchase}.</span>
                  </>
                )}

                {reward.rewardType === "Cashback" && (
                  <>
                    <span>Get cashback {reward.maxEligibleAmount} on purchases above ₹{reward.minInvoiceValue}.</span>
                  </>
                )}

                {reward.rewardType === "Referral" && (
                  <>
                    <span>Referral Rewards {reward.amountForPoint} Active ₹{reward.minPurchase}</span>
                  </>
                )}

                {reward.rewardType === "Tiered" && (<>
                  <span>Tiered Loyalty {reward.amountForPoint} Program ₹{reward.minPurchase}</span>
                </>)}
              </div>
            </div>

            {/* Footer Section */}
            <div
              style={{
                position: 'absolute',
                width: 360,
                left: 16,
                top: 130,
                padding: "8px 0",
                borderTop: "1px solid #EAEAEA",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Left section */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    fontSize: 14,
                    color: "#1F7FFF",
                    fontFamily: "Inter",
                  }}
                >
                  Show Details
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: "#727681",
                    fontFamily: "Inter",
                  }}
                >
                  {reward.deadline && (
                    <>
                      • Valid till {(formatDate(reward.deadline))}
                    </>
                  )}
                </div>
              </div>

              {/* Right icon */}
              <div
                style={{
                }}
              >
                <GrSend style={{ color: "#1F7FFF" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default PointsRewards