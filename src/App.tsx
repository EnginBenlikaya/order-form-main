import React, { useState, useEffect } from 'react';
import { Package, Truck, User, Phone, FileText, Plus, Trash2, Send, CheckCircle, AlertTriangle, Info, MessageSquare } from 'lucide-react';

// Import Firebase config and Firestore functions
import { db } from './firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [formData, setFormData] = useState({
    orderCreator: "",
    customerName: "",
    vehicleType: "",
    shipmentType: "",
    vehiclePlate: "",
    driverName: "",
    driverPhone: "",
    recipientName: "",
    recipientPhone: "",
    deliveryNote: "",
  });
  
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [palletCount, setPalletCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [warnings, setWarnings] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const productWeights = {
    "Gürpınar Pet 0,33 Lt.": 910,
    "Gürpınar Pet 0,50 Lt.": 910,
    "Gürpınar Pet 1,00 Lt.": 800,
    "Gürpınar Pet 1,50 Lt.": 800,
    "Gürpınar Pet 5 Lt.": 850,
    "Gürpınar Pet 19 Lt.": 800,
    "Gürpınar Bardak 200 ml.": 900,
    "Gürpınar Bardak 250 ml.": 1050,
    "Kızılay Pet 0,33 Lt.": 910,
    "Kızılay Pet 0,50 Lt.": 910,
    "Kızılay Pet 1,00 Lt.": 800,
    "Kızılay Pet 1,50 Lt.": 800,
    "Kızılay Pet 5 Lt.": 850,
    "Kızılay Bardak 200 ml.": 900,
    "Kızılay Bardak 250 ml.": 1050,
  };

  const getRecommendedVehicleType = (totalWeight) => {
    if (totalWeight <= 15000) return "kamyon";
    return "tır";
  };

  const checkWarnings = () => {
    const newWarnings = [];
    if (!formData.orderCreator) {
      newWarnings.push({ type: 'error', message: 'Sipariş oluşturan kişi seçilmedi!' });
    }
    if (!formData.customerName.trim()) {
      newWarnings.push({ type: 'error', message: 'Cari adı girilmedi!' });
    }
    if (products.length === 0) {
      newWarnings.push({ type: 'error', message: 'Hiç ürün eklenmedi!' });
    }
    if (!formData.vehicleType) {
      newWarnings.push({ type: 'error', message: 'Araç tipi seçilmedi!' });
    }
    if (!formData.shipmentType) {
      newWarnings.push({ type: 'error', message: 'Sevk tipi seçilmedi!' });
    }
    if (formData.shipmentType === "kendisi") {
      if (!formData.vehiclePlate.trim()) {
        newWarnings.push({ type: 'error', message: 'Araç plakası girilmedi!' });
      }
      if (!formData.driverName.trim()) {
        newWarnings.push({ type: 'error', message: 'Şoför adı girilmedi!' });
      }
      if (!formData.driverPhone.trim()) {
        newWarnings.push({ type: 'error', message: 'Şoför telefonu girilmedi!' });
      }
    }
    if (formData.shipmentType === "biz") {
      if (!formData.recipientName.trim()) {
        newWarnings.push({ type: 'error', message: 'Teslimat kişi adı girilmedi!' });
      }
      if (!formData.recipientPhone.trim()) {
        newWarnings.push({ type: 'error', message: 'Teslimat telefonu girilmedi!' });
      }
    }
    const totalWeight = products.reduce((sum, product) => sum + product.weight, 0);
    if (totalWeight > 26500) {
      newWarnings.push({ type: 'error', message: 'Toplam ağırlık 26.500 kg sınırını aşıyor!' });
    } else if (totalWeight > 24000) {
      newWarnings.push({ type: 'warning', message: 'Ağırlık sınıra yaklaşıyor! Dikkatli olun.' });
    }
    const recommendedVehicle = getRecommendedVehicleType(totalWeight);
    if (formData.vehicleType && formData.vehicleType !== recommendedVehicle) {
      const vehicleName = recommendedVehicle === "kamyon" ? "Kamyon" : "Tır";
      newWarnings.push({ type: 'info', message: `Bu ağırlık için ${vehicleName} önerilir! (${totalWeight.toLocaleString()} kg)` });
    }
    if (formData.driverPhone && !/^05\d{9}$/.test(formData.driverPhone.replace(/\s/g, ''))) {
      newWarnings.push({ type: 'warning', message: 'Şoför telefonu 05xxxxxxxxx formatında olmalı!' });
    }
    if (formData.recipientPhone && !/^05\d{9}$/.test(formData.recipientPhone.replace(/\s/g, ''))) {
      newWarnings.push({ type: 'warning', message: 'Teslimat telefonu 05xxxxxxxxx formatında olmalı!' });
    }
    if (formData.shipmentType === "biz" && !formData.deliveryNote.trim()) {
      newWarnings.push({ type: 'info', message: 'Teslimat notu eklemeniz önerilir!' });
    }
    setWarnings(newWarnings);
  };

  useEffect(() => {
    checkWarnings();
  }, [formData, products]);

  useEffect(() => {
    const totalWeight = products.reduce((sum, product) => sum + product.weight, 0);
    if (totalWeight > 0 && !formData.vehicleType) {
      const recommended = getRecommendedVehicleType(totalWeight);
      setFormData(prev => ({ ...prev, vehicleType: recommended }));
    }
  }, [products]);

  const addProduct = () => {
    const count = parseInt(palletCount);
    if (!productName.trim()) {
      alert("Ürün adı boş olamaz!");
      return;
    }
    if (isNaN(count) || count <= 0) {
      alert("Palet adedi geçerli bir pozitif sayı olmalı!");
      return;
    }
    const weight = productWeights[productName] * count;
    const newProduct = { productName, palletCount: count, weight };
    setProducts((prev) => [...prev, newProduct]);
    setProductName("");
    setPalletCount("");
  };

  const removeProduct = (index) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const totalWeight = products.reduce((sum, product) => sum + product.weight, 0);
  const maxWeight = 26500;
  const isOverWeight = totalWeight > maxWeight;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
  
    const criticalErrors = warnings.filter(w => w.type === 'error');
    if (criticalErrors.length > 0) {
      alert("Lütfen önce tüm hataları düzeltin:\n" + criticalErrors.map(w => "• " + w.message).join("\n"));
      return;
    }
  
    const confirmSubmit = window.confirm("SİPARİŞ FORMUNU KAYDETMEYE EMİN MİSİN?");
    if (!confirmSubmit) {
      return;
    }
  
    setIsLoading(true);
    try {
      const dataToSend = {
        ...formData,
        vehiclePlate: formData.shipmentType === "kendisi" ? formData.vehiclePlate : null,
        driverName: formData.shipmentType === "kendisi" ? formData.driverName : null,
        driverPhone: formData.shipmentType === "kendisi" ? formData.driverPhone : null,
        recipientName: formData.shipmentType === "biz" ? formData.recipientName : null,
        recipientPhone: formData.shipmentType === "biz" ? formData.recipientPhone : null,
        deliveryNote: formData.deliveryNote || null,
        products: products,
        totalWeight: totalWeight,
        createdAt: serverTimestamp(), // Use Firebase server-side timestamp
      };

      // Add a new document with a generated id to the "orders" collection
      const docRef = await addDoc(collection(db, "orders"), dataToSend);
      console.log("Document written to Firestore with ID: ", docRef.id);

      setSubmitStatus('success');
      alert('Sipariş başarıyla Firestore\'a kaydedildi!');
      
      // Reset form
      setFormData({
        orderCreator: "", customerName: "", vehicleType: "", shipmentType: "",
        vehiclePlate: "", driverName: "", driverPhone: "", recipientName: "",
        recipientPhone: "", deliveryNote: "",
      });
      setProducts([]);
      setTimeout(() => setSubmitStatus(null), 5000);

    } catch (error) {
      console.error("Error adding document to Firestore: ", error);
      setSubmitStatus('error');
      alert(`Hata: Sipariş kaydedilemedi. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // (The rest of your component's JSX remains exactly the same)
  // ... from <div className="min-h-screen..."> to </div>
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Sipariş Formu
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Sipariş bilgilerinizi aşağıdaki forma girerek sistemimize kayıt edebilirsiniz.
          </p>
        </div>

        {/* Success/Error Messages */}
        {submitStatus && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            submitStatus === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {submitStatus === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="font-medium">
              {submitStatus === 'success' 
                ? 'Sipariş başarıyla kaydedildi!' 
                : 'Sipariş kaydedilirken bir hata oluştu!'
              }
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Temel Bilgiler</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sipariş Oluşturan *
                </label>
                <select
                  name="orderCreator"
                  value={formData.orderCreator}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Seçiniz</option>
                  <option value="Erhan Akkaş">Erhan Akkaş</option>
                  <option value="Serdar Mehmet Karaarslan">Serdar Mehmet Karaarslan</option>
                  <option value="Süleyman Adışen">Süleyman Adışen</option>
                  <option value="Uğur Avcı">Uğur Avcı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Adı *
                </label>
                <input
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Müşteri adını giriniz"
                />
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Package className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Ürün Bilgileri</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Adı *
                </label>
                <select
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="">Ürün Seçiniz</option>
                  {Object.keys(productWeights).map((product) => (
                    <option key={product} value={product}>{product}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Palet Adeti *
                </label>
                <input
                  type="number"
                  value={palletCount}
                  onChange={(e) => setPalletCount(e.target.value)}
                  min="1"
                  placeholder="Adet"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addProduct}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Ekle</span>
                </button>
              </div>
            </div>

            {products.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Eklenen Ürünler</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Ürün</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Adet</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Ağırlık (kg)</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-2 text-sm text-gray-900">{product.productName}</td>
                          <td className="py-3 px-2 text-sm text-gray-600">{product.palletCount}</td>
                          <td className="py-3 px-2 text-sm text-gray-600">{product.weight.toLocaleString()}</td>
                          <td className="py-3 px-2">
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    Toplam Ağırlık: {totalWeight.toLocaleString()} kg
                  </span>
                  {isOverWeight && (
                    <span className="text-red-600 font-medium flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Tonaj sınırını aştı! (Max 26.500 kg)</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Truck className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Taşıma Bilgileri</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Araç Tipi *
                  {totalWeight > 0 && (
                    <span className="text-xs text-blue-600 ml-2">
                      (Önerilen: {getRecommendedVehicleType(totalWeight) === "kamyon" ? "Kamyon" : "Tır"})
                    </span>
                  )}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="vehicleType"
                      value="kamyon"
                      checked={formData.vehicleType === "kamyon"}
                      onChange={handleChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      required
                    />
                    <span className="text-gray-700">Kamyon</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="vehicleType"
                      value="tır"
                      checked={formData.vehicleType === "tır"}
                      onChange={handleChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <span className="text-gray-700">Tır</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sevk Tipi *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="shipmentType"
                      value="kendisi"
                      checked={formData.shipmentType === "kendisi"}
                      onChange={handleChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      required
                    />
                    <span className="text-gray-700">Kendisi Gelecek</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="shipmentType"
                      value="biz"
                      checked={formData.shipmentType === "biz"}
                      onChange={handleChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <span className="text-gray-700">Biz Sevk Edeceğiz</span>
                  </label>
                </div>
              </div>
            </div>

            {formData.shipmentType === "kendisi" && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Araç Plakası *
                  </label>
                  <input
                    name="vehiclePlate"
                    value={formData.vehiclePlate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="34 ABC 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şoför Adı *
                  </label>
                  <input
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Şoför adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Şoför Telefon *
                  </label>
                  <input
                    type="number"
                    name="driverPhone"
                    value={formData.driverPhone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="05xx xxx xx xx"
                  />
                </div>
              </div>
            )}

            {formData.shipmentType === "biz" && (
              <div className="mt-6 space-y-4 p-4 bg-green-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teslimat Kişi Adı *
                    </label>
                    <input
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="Teslim alacak kişi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teslimat Telefon *
                    </label>
                    <input
                      type="number"
                      name="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      placeholder="05xx xxx xx xx"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Teslimat Notu</span>
                    <span className="text-xs text-gray-500">(Önerilir)</span>
                  </label>
                  <textarea
                    name="deliveryNote"
                    value={formData.deliveryNote}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="Teslimat ile ilgili özel notlar, adres tarifi, dikkat edilmesi gerekenler..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={isLoading || isOverWeight}
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span>{isLoading ? "Kaydediliyor..." : "Siparişi Kaydet"}</span>
            </button>
            
            {warnings.filter(w => w.type === 'error').length > 0 && (
              <p className="text-red-600 text-sm mt-2">
                Formu göndermek için önce tüm hataları düzeltmelisiniz.
              </p>
            )}
          </div>
        </form>

        <div className="text-center mt-12 text-gray-500">
          <p>Sipariş formunuz Firebase Firestore'a otomatik olarak kaydedilecektir.</p>
        </div>
      </div>
    </div>
  );
}

export default App;