import first from "../images/first.jpg";
import second from "../images/second.png";
import third from "../images/third.gif";
import fourth from "../images/fourth.png";
const Home = () => {
  return (
    <div className="w-full h-screen overflow-auto">
      {/* Section 1: Hero */}
      <section className="h-screen flex items-center justify-between px-24 bg-white text-black">
        {/* Left Content */}
        <div className="flex flex-col items-start gap-y-6">
          <div className="text-7xl font-normal leading-tight">
            The easy test <br />
            maker that engages <br />
            your colleagues, <br />
            pupils, or friends
          </div>
          <div className="text-2xl mt-4">
            The easy test maker that engages your colleagues, pupils, or friends
          </div>
          <button className="bg-[#00BFFF] text-white px-6 py-3 mt-1 rounded-full shadow-lg hover:bg-[#009ACD] transition">
            Get Started
          </button>
        </div>

        {/* Right Image */}
        <div className="w-1/2">
          <img
            src={first}
            alt="Hero section illustration"
            className="w-[99%] h-auto  "
          />
        </div>
      </section>

      {/* Section 2: About */}
      <section className="h-screen flex items-center bg-white text-black">
        {/* Left Content */}
        <div className="w-1/2 px-24">
          <h2 className="text-5xl font-bold mb-6">TEACHER LOGIN</h2>
          <p className="text-xl leading-relaxed mb-6 text-justify">
            The easy test maker that engages your colleagues, pupils, or
            friends. The easy test maker that engages your colleagues, pupils,
            or friends. The easy test maker that engages your colleagues,
            pupils, or friends. The easy test maker that engages your
            colleagues, pupils, or friends. The easy test maker that engages
            your colleagues, pupils, or friends. The easy test maker that
            engages your colleagues, pupils, or friends. The easy test maker
            that engages your colleagues, pupils, or friends.
          </p>

          <button className="bg-[#00BFFF] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#009ACD] transition">
            Get Started
          </button>
        </div>

        {/* Right Image - Full height with cut */}
        <div className="w-1/2 h-screen">
          <img
            src={second}
            alt="Teacher Login Illustration"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Section 3: Features */}
      <section className="h-screen flex flex-col justify-center items-center  bg-white text-black px-12 text-center">
        {/* Heading */}
        <h2 className="text-5xl font-bold mb-6">AUTOMATE QUESTION ENTERING</h2>

        {/* Description */}
        <p className="text-xl leading-relaxed max-w-3xl mb-8">
          The easy test maker that engages your colleagues, pupils, or friends.
          The easy test maker that engages your colleagues, pupils, or friends.
          The easy test maker that engages your colleagues, pupils, or friends.
          The easy test maker that engages your colleagues, pupils, or friends.
          The easy test maker that engages your colleagues, pupils, or friends.
          The easy test maker that engages your colleagues, pupils, or friends.
          The easy test maker that engages your colleagues, pupils, or friends.
        </p>

        {/* Image */}
        <img
          src={third}
          alt="Automate Question Entry"
          className="w-3/4 max-w-md"
        />
      </section>

      {/* Section 4: Testimonials */}
      <section className="h-screen flex flex-col justify-center items-center bg-white text-black px-12 py-16 text-center">
        {/* Heading */}
        <h2 className="text-5xl font-bold mb-12 text-black">BENEFITS</h2>

        {/* Benefits Wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl text-left">
          {/* Manual Entry */}
          <div className="bg-white p-8 rounded-xl  border-l-4 border-red-500">
            <h3 className="text-3xl font-semibold mb-4 text-red-500 flex items-center">
              ❌ Manual Entry
            </h3>
            <ul className="space-y-3 text-lg">
              <li>⏳ Takes too much time</li>
              <li>🚫 High chance of human errors</li>
              <li>📌 Requires constant proofreading</li>
              <li>📉 Difficult to manage large test banks</li>
              <li>😓 Repetitive and exhausting</li>
            </ul>
          </div>

          {/* Automated Entry */}
          <div className="bg-white p-8 rounded-xl  border-l-4 border-green-500">
            <h3 className="text-3xl font-semibold mb-4 text-green-500 flex items-center">
              ✅ Automated Entry
            </h3>
            <ul className="space-y-3 text-lg">
              <li>⚡ Instantly converts documents into questions</li>
              <li>🎯 Reduces mistakes by automating validation</li>
              <li>📝 Saves time for more important tasks</li>
              <li>📊 Handles large-scale test creation effortlessly</li>
              <li>🚀 Boosts efficiency & accuracy</li>
            </ul>
          </div>
        </div>

        {/* Conclusion */}
        <div className="mt-12 text-xl max-w-4xl bg-white p-6 rounded-lg ">
          <p className="text-gray-700">
            Stop wasting time on **manual work**! Switch to{" "}
            <span className="font-bold text-green-500">Automated Entry</span>
            and focus on what truly matters – **creating engaging and effective
            tests**.
          </p>
        </div>
      </section>

      {/* Section 5: Contact */}
      <section className="h-screen flex flex-col justify-center items-center bg-white text-black px-12 py-16 text-center">
        {/* Heading */}
        <h2 className="text-5xl font-bold mb-6 text-gray-800">
          ANY QUESTION? CONTACT US
        </h2>

        {/* Contact Button */}
        <button className="bg-[#00BFFF] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#009ACD] transition">
          Contact
        </button>

        {/* Footer */}
        <footer className="w-full mt-16 bg-black py-12 px-6 md:px-24 flex flex-col md:flex-row justify-between items-center">
          {/* Left Section */}
          <div className="text-left space-y-4">
            {/* Logo Placeholder */}
            <div className="text-3xl font-bold text-blue-600">
              <img src={fourth} alt="logo" className="w-3/4 max-w-md" />
            </div>
            <p className="text-lg text-gray-700 max-w-sm">
              Get started to grow up your business with a personal AI manager.
            </p>
            <p className="text-sm text-gray-500">Maxwell, 2023.</p>
          </div>

          {/* Right Section */}
          <div className="text-right flex flex-col items-center md:items-end space-y-4">
            {/* Get Started Button */}
            <button className="bg-[#00BFFF] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#009ACD] transition">
              Get Started
            </button>

            {/* Legal Links */}
            <div className="flex space-x-6 text-gray-600 text-sm mt-4">
              <a href="#" className="hover:underline">
                Terms of Service
              </a>
              <a href="#" className="hover:underline">
                Privacy Policy
              </a>
              <a href="#" className="hover:underline">
                Cookies
              </a>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default Home;
