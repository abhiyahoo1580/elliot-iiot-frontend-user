import { useEffect } from "react";

export default function Help() {
  useEffect(() => {
    document.title = "Help";
  }, []);
  return (
    <div className="p-6 mt-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-8 text-orange-500">
          CONTACT US
        </h2>

        <div className="space-y-6">
          {/* Phone Numbers */}
          <div className="flex items-center gap-8 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-2xl text-orange-500">📞</div>
              <div>
                <span className="font-semibold text-gray-700">USA</span>
                <a
                  href="tel:+1281-891-3766"
                  className="ml-2 text-orange-500 hover:underline font-medium"
                >
                  +1 281-891-3766
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl text-orange-500">📞</div>
              <div>
                <span className="font-semibold text-gray-700">India</span>
                <a
                  href="tel:+91-9881078854"
                  className="ml-2 text-orange-500 hover:underline font-medium"
                >
                  +91-9881 0788 54
                </a>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl text-orange-500">✉️</div>
            <div>
              <span className="font-semibold text-gray-700 mr-2">Email:</span>
              <a
                href="mailto:info@elliotsystems.com"
                className="text-orange-500 hover:underline font-medium"
              >
                info@elliotsystems.com
              </a>
            </div>
          </div>

          {/* Website */}
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl text-orange-500">🌐</div>
            <div>
              <span className="font-semibold text-gray-700 mr-2">Website:</span>
              <a
                href="https://www.elliotsystems.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline font-medium"
              >
                www.elliotsystems.com
              </a>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* USA Address */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl text-orange-500">🏢</div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  USA Office
                </h3>
              </div>
              <p className="text-gray-700 ml-11">
                15500 Voss Road
                <br />
                <span className="font-medium">Suite 401</span>
                <br />
                Sugar Land, TX, 77498
              </p>
            </div>

            {/* India Address */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl text-orange-500">🏢</div>
                <h3 className="font-semibold text-gray-800 text-lg">
                  India Office
                </h3>
              </div>
              <p className="text-gray-700 ml-11">
                Elliot Systems,{" "}
                <span className="font-medium">Quantum Works, 6th Floor</span>
                <br />
                CTS No. 177(p, metro station, S. No. 43/2,
                <br />
                near Nal stop, Pandurang Colony,
                <br />
                Erandwane, Pune, Maharashtra 411004
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
