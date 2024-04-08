from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import json
import fitz  # PyMuPDF
from flask_sqlalchemy import SQLAlchemy
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app) 

conn = mysql.connector.connect(
    host="localhost",
    user="credit",
    password="1234",
    database="CreditTransactions"
)




def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080'
    return response

def extract_text_from_pdf(file):
    doc = fitz.open(stream=file.read())
    text = ''
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text += page.get_text()
    doc.close()
    return text

def parse_file(file):
    pdf_text = extract_text_from_pdf(file)
    # Declare pattern
    pattern = re.compile(r"New Charges.*?four digits of card number", re.DOTALL)

    match = pattern.search(pdf_text)

    extracted_content = match.group(0)

    # Declare pattern
    pattern2 = re.compile(r"(\d{4})\n(\d+)\n(\d{2}/\d{2}/\d{2})\n(\d{2}/\d{2}/\d{2})\n(.*?)\n(.*?)\n\$(\d+\.\d{2})", re.DOTALL)

    matches2 = pattern2.findall(extracted_content)
    # Convert to JSON
    transactions = []
    for match in matches2:
        transaction = {
            "Card Number": match[0],
            "Transaction ID": match[1],
            "Transaction Date": match[2],
            "Post Date": match[3],
            "Merchant": match[4],
            "Location": match[5],
            "Amount": float(match[6])
        }
        transactions.append(transaction)

    json_data = json.dumps(transactions, indent=2)
    # print(json_data)
    return json_data

@app.route('/transactions', methods = ['GET'])
def get_transactions():
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM transactions')  # 假设你的事务表名为 transactions
        transactions = cursor.fetchall()
        return jsonify(transactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'no file selected', 400
    
    file = request.files['file']
    if file.filename == '':
        return 'no file selected', 400



    data = parse_file(file)
    print(data)

    # # save the file to local folder
    # file.save('uploads/' + file.filename)

    
    return jsonify(data)

@app.route('/submit', methods=['POST'])
def updateDatabase():
    if request.method == 'POST':
        data = request.get_json()
        print(data)

        cursor = conn.cursor()

        # sql = "INSERT INTO Transactions (TransactionID, TransactionDate, CardNumber, Merchant, Amount, Category) VALUES (%s, %s, %s, %s, %s, %s)"
        # val = (data['Transaction ID'], data['Transaction Date'], data['Card Number'], data['Merchant'], data['Amount'], data['Category'])
 
        for record in data:
            transaction_date = datetime.strptime(record['Transaction Date'], '%m/%d/%y').strftime('%Y-%m-%d')
            sql = "INSERT INTO Transactions (TransactionID, TransactionDate, CardNumber, Merchant, Amount, Category) VALUES (%s, %s, %s, %s, %s, %s)"
            val = (record['Transaction ID'], transaction_date, record['Card Number'], record['Merchant'], record['Amount'], record['category'])       
            cursor.execute(sql, val)
        #  # 执行 SQL 语句
        # cursor.execute(sql, val)

        # # 提交更改
        conn.commit()

        # # 关闭游标
        cursor.close()

        return 'Data inserted successfully!'
       
    
if __name__ == '__main__':
    app.run(host='localhost', port=8000, debug=True)
