import logo from './logo.svg';
import './App.css';
import './material-design-iconic-font.min.css';
import {HashRouter as Router, Link, NavLink, Route, Routes, useNavigate} from 'react-router-dom';
import React, {useState, useContext, useEffect} from 'react';
import Dashboard from "./Dashboard";

import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function About(){
  return (
      <div className="about-container">
        <h1 className="about-title">Welcome to Smart Bill Tracker</h1>
        <p className="about-description">
          Introducing "Smart Bill Tracker: Your Automated Expense Manager"
          <br/>
          Say goodbye to tedious manual tracking! Our full-stack website simplifies expense management by streamlining
          the process - just upload your credit card statement and let us handle the rest.
        </p>
        <div className="about-features">
          <h2 className="feature-title">Key Features:</h2>
          <ul className="feature-list">
            <li>Automatic Record: Effortlessly extract dates, items, and amounts from your statement file.</li>
            <li>Custom Categories: Tailor your expense categories to your needs and watch as our platform seamlessly
              organizes your transactions.
            </li>
            <li>Insightful Analysis: Gain valuable insights with monthly diagrams showcasing your spending habits across
              different categories.
            </li>
          </ul>
        </div>
        <p className="about-join">
          Experience hassle-free expense management like never before. Join us today and take control of your finances
          effortlessly!
        </p>
      </div>
  )
}

function Upload() {

  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [newTransactions, setNewTransactions] = useState([]);


  // 當 newTransactions 狀態發生變化時，將調用 notifyServer 函式通知服務器
  useEffect(() => {
    if (newTransactions.length > 0) {
      notifyServer(newTransactions);
    }
  }, [newTransactions]);

  // 將新的交易數據發送到服務器進行提交
  const notifyServer = async (state) => {
    try {
      const response = await fetch('http://localhost:8000/submit', {
        method: 'POST',
        body: JSON.stringify(newTransactions),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('Upload Success');
      } else {
        throw new Error('Upload Failed');
      }
    } catch (error) {
      console.error('Upload Error', error);
    }
  };

  // 處理用戶提交表單的事件。它會更新交易列表，並將新的交易數據設置為 newTransactions 狀態
  const handleSubmit = async (event) => {
    event.preventDefault()
    console.log("Before" +
        " update", transactions)
    if (transactions.length === 0) {
      alert('Please select a statement file');
      return;
    }

    //update transactions
    const selectElements = document.getElementsByTagName("select");
    const selectedValues = [];
    for (let i = 0; i < selectElements.length; i++) {
      const selectElement = selectElements[i];
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      selectedValues.push(selectedOption.value);
    }
    console.log(selectedValues);
    const mergedTransactions = transactions.map((transaction, index) => ({
      ...transaction,
      category: selectedValues[index] // 假设 selectedValues 是您从下拉列表中获取的类别数组
    }));
    console.log(mergedTransactions)
    setNewTransactions(mergedTransactions)

    // Show notification
    if (toast) {
      toast.success('Data saved successfully!', {
        position: "top-center",
        autoClose: 2000
      });
    } else {
      console.error("Toast object is undefined");
    }
  }

  // 處理當用戶選擇文件時的事件。它會更新 selectedFile 狀態，以反映用戶選擇的文件。
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // 處理當用戶點擊上傳按鈕時的事件。它會將選擇的文件上傳到服務器並獲取交易數據，並將其設置為 transactions 狀態。
  const handleUpload = async (event) => {
    event.preventDefault()
    if (!selectedFile) {
      alert('Please select a statement file');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(JSON.parse(data));
        setIsFileUploaded(true);

        console.log('Upload Success', data);
        console.log(transactions)

      } else {
        throw new Error('Upload Failed');
      }
    } catch (error) {
      console.error('Upload Error', error);
    }

  }

  return (
      <div>
        <h1>Upload New Statement</h1>
        <input type="file" onChange={handleFileChange}/>
        <button className="btn btn-outline-primary" onClick={handleUpload}>Upload new statement</button>

        { isFileUploaded && transactions.length === 0 ?(
            <div>
              <h2>Transaction List:</h2>
              <h6>No transactions on this statement</h6>
            </div>
        ) : (
            <div style={{display: isFileUploaded ? 'block' : 'none' }}>
                <h2>Transaction List:</h2>
                <table className="ttable">
                  <thead>
                  <tr>
                    <th>Transaction Date</th>
                    <th>Merchant</th>
                    <th>Amount</th>
                    <th>Category</th>
                  </tr>
                  </thead>
                  <tbody>
                  {transactions.map((transaction, index) => (
                      <tr key={index}>
                        <td>{transaction["Transaction Date"]}</td>
                        <td>{transaction["Merchant"]}</td>
                        <td>{transaction["Amount"]}</td>
                        <td>
                          <select name="category">
                            <option value="" disabled>Please select a category</option>
                            <option value="Transportation">Transportation</option>
                            <option value="Dining">Dining</option>
                            <option value="Grocery">Grocery</option>
                            <option value="Housing">Housing</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Education">Education</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
                <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
              </div>
          )
        }

      </div>

  );
}

function App() {

  return (
      <Router>
        <div>
          <div className="container-fluid">
            <div className="row">
              <nav className="col-md-2 d-none d-md-block sidebar">
                <h1 className="title">
                  Smart Bill Tracker
                </h1>
                <div>
                  <ul className="nav flex-column">
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/upload">
                        <i className="zmdi zmdi-upload"></i>
                        Upload
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/statements">
                        <i className="zmdi zmdi-file-text"></i>
                        My Statements
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/dashboard">
                        <i className="zmdi zmdi-widgets"></i>
                        Dashboard
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className="nav-link" to="/about">
                        <i className="zmdi zmdi-help"></i>
                        About
                      </NavLink>
                    </li>


                  </ul>
                </div>
              </nav>


              <main role="main" className="col-md-9 ml-sm-auto col-lg-12 my-5">
                <div className={"upload"}>

                  <Routes>
                    <Route path="/upload" element={<Upload/>}/>
                    <Route path="/dashboard" element={<Dashboard/>}/>
                    <Route path="/about" element={<About/>}/>
                  </Routes>

                </div>
              </main>
          </div>
        </div>


        {/*</MyProvider>*/}
      </div>
      </Router>
  );
}

export default App;
