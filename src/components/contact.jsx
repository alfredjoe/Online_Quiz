import React, { useRef, useEffect, useState } from "react";

const Modal = ({ showModal, setShowModal }) => {
  const modalRef = useRef();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupColor, setPopupColor] = useState("");

  const handleClickOutside = useRef((event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      setShowModal(false);
    }
  });

  useEffect(() => {
    const handleOutsideClick = handleClickOutside.current;
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name) {
      setPopupMessage("Name is required.");
      setPopupColor("red");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setPopupMessage("Please enter a valid email address.");
      setPopupColor("red");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }

    if (!message) {
      setPopupMessage("Message is required.");
      setPopupColor("red");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }

    // Simulate successful form submission
    setShowModal(false);
    setPopupMessage("Message sent successfully!");
    setPopupColor("green");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  return (
    <>
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            ref={modalRef}
            className="relative bg-white w-full max-w-lg mx-auto p-6 rounded-lg shadow-lg"
          >
            <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00BFFF] focus:border-[#00BFFF] sm:text-sm"
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00BFFF] focus:border-[#00BFFF] sm:text-sm"
                  placeholder="Your email"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  name="message"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00BFFF] focus:border-[#00BFFF] sm:text-sm"
                  rows="4"
                  placeholder="Your message"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="w-full bg-[#00BFFF] text-white px-4 py-2 rounded-md shadow-lg hover:bg-[#009ACD] transition"
                >
                  Send Message
                </button>
              </div>

              {showPopup && popupColor === "red" && (
                <div className="absolute bottom-[-6rem] left-1/2 transform -translate-x-1/2 px-4 py-2 mb-4 rounded-lg shadow-lg text-white bg-red-500">
                  {popupMessage}
                </div>
              )}
            </form>

            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 transition"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
          </div>
        </div>
      ) : null}

      {showPopup && popupColor === "green" && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-white bg-green-500">
          {popupMessage}
        </div>
      )}
    </>
  );
};

export default Modal;
