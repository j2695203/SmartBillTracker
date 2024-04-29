import './App.css';
import './material-design-iconic-font.min.css';

import {HashRouter as Router, Link, NavLink, Route, Routes, useNavigate} from 'react-router-dom';
import React, {useState, useContext, useEffect} from 'react';
import Dashboard from "./Dashboard";

import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';


function Statements(){
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isDataFetched, setIsDataFetched] = useState(false); // New state variable


    // 在这里执行查询数据库的操作，使用 startDate 和 endDate 来构建查询时间区间
  const handleConfirm = async () => {
    try {
      const formattedStartDate = startDate.toISOString().slice(0, 10); // 格式化起始日期
      const formattedEndDate = endDate.toISOString().slice(0, 10); // 格式化结束日期

      const response = await fetch(`http://localhost:8000/transactions/range?start_date=${formattedStartDate}&end_date=${formattedEndDate}`);
      const data = await response.json();
      setTransactions(data)
      setIsDataFetched(true); // Update isDataFetched
      console.log(data)
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


  return (
      <div>
        <h1>Historical Statements</h1>

        <div className="date-picker-container">
          <span>Time Period Selection : </span>
          <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              dateFormat="yyyy-MM-dd"
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText=" Start Date"
          />

          <div className="spacer" style={{padding: '0 10px'}}/>

          <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              dateFormat="yyyy-MM-dd"
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              placeholderText=" End Date"
          />
          <div className="spacer" style={{padding: '0 10px'}}/>

          <button class="btn btn-outline-primary" onClick={handleConfirm}>Confirm</button>
        </div>

        <div className="transactions">
          {/* Conditional rendering based on isDataFetched and transactions.length */}
          {isDataFetched ? (
              <>
                {transactions.length === 0 ? (
                    <h6>No transactions available for the selected period</h6>
                ) : (
                    <>
                      <h2>Transactions</h2>
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
                        {/* Transaction data */}
                        {transactions.map((transaction, index) => (
                            <tr key={index}>
                              <td>{new Date(transaction[0]).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: '2-digit'
                              })}</td>
                              <td>{transaction[1]}</td>
                              <td style={{textAlign: 'center'}}>{transaction[2]}</td>
                              <td>{transaction[3]}</td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </>
                )}
              </>
          ) : (
              <h6>No time period is selected</h6>
          )}
        </div>
      </div>
  )
}

function About() {
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
            <li>
              Historical Statements Query: Users can retrieve previously uploaded statements within selected period, eliminating the need to manually search on banking websites.
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
        alert('Data saved successfully!');
      } else {
        throw new Error('Upload Failed');
      }
    } catch (error) {
      console.error('Upload Error', error);
      alert('Error: Data has already been saved before!');
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

        <div className="input-group">
          <input type="file" className="form-control" onChange={handleFileChange}/>
          <button className="btn btn-outline-secondary" type="button" onClick={handleUpload}>Upload</button>
        </div>

        {isFileUploaded && transactions.length === 0 ? (
            <div>
              <h2>Transaction List:</h2>
              <h6>No transactions on this statement</h6>
            </div>
        ) : (
            <div style={{display: isFileUploaded ? 'block' : 'none'}}>
              <h2>Transaction List:</h2>
              <table className="ttable mb-3">
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
                      <td style={{ textAlign: 'center'}}>{transaction["Amount"]}</td>
                      <td>
                        <select name="category">
                          <option selected="" disabled>Please select a category</option>
                          <option value="Dining">Dining</option>
                          <option value="Grocery">Grocery</option>
                          <option value="Housing">Housing</option>
                          <option value="Transportation">Transportation</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Travel">Travel</option>
                          <option value="Education">Education</option>
                          <option value="Health">Health</option>
                          <option value="Bill">Bill</option>
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
              <NavLink to="/">
                  <h1 className="title">
                    Smart Bill Tracker
                  </h1>
                </NavLink>
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
                <div className={"content"}>
                  <Routes>
                    <Route path="/" element={<About/>}/>
                    <Route path="/upload" element={<Upload/>}/>
                    <Route path="/dashboard" element={<Dashboard/>}/>
                    <Route path="/about" element={<About/>}/>
                    <Route path="/statements" element={<Statements/>}/>
                  </Routes>
                </div>
              </main>
          </div>
        </div>
      </div>
      </Router>
  );
}

export default App;
