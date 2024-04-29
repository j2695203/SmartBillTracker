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

# Establish connection to MySQL database
conn = mysql.connector.connect(
    host="localhost",
    user="credit",
    password="1234",
    database="CreditTransactions"
)

# Define function to add CORS headers to responses
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080'
    return response

# Define function to extract text from PDF file
def extract_text_from_pdf(file):
    doc = fitz.open(stream=file.read())
    text = ''
    for page_num in range(doc.page_count):
        page = doc[page_num]
        text += page.get_text()
    doc.close()
    return text

# Define function to parse PDF file and extract transaction data
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
    return json_data

# Define route for getting transactions
@app.route('/transactions', methods = ['GET'])
def get_transactions():
    try:
        year = request.args.get('year')
        cursor = conn.cursor(dictionary=True)
        if year:
            cursor.execute('SELECT * FROM transactions WHERE YEAR(TransactionDate) = %s', (year,))
        else:
            cursor.execute('SELECT * FROM transactions')
        transactions = cursor.fetchall()
        return jsonify(transactions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()

# Define route for uploading files
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'no file selected', 400
    
    file = request.files['file']
    if file.filename == '':
        return 'no file selected', 400

    data = parse_file(file)
    print(data)
    return jsonify(data)

# Define route for submitting data to database
@app.route('/submit', methods=['POST'])
def updateDatabase():
    if request.method == 'POST':
        data = request.get_json()
        print(data)

        cursor = conn.cursor()

        for record in data:
            transaction_date = datetime.strptime(record['Transaction Date'], '%m/%d/%y').strftime('%Y-%m-%d')
            sql = "INSERT INTO Transactions (TransactionID, TransactionDate, CardNumber, Merchant, Amount, Category) VALUES (%s, %s, %s, %s, %s, %s)"
            val = (record['Transaction ID'], transaction_date, record['Card Number'], record['Merchant'], record['Amount'], record['category'])       
            cursor.execute(sql, val)

        conn.commit()
        cursor.close()
        return 'Data inserted successfully!'
       
# Define route for getting transactions by date range
@app.route('/transactions/range', methods=['GET'])
def get_transactions_by_range():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        print('Start Date:', start_date)
        print('End Date:', end_date)

        cursor = conn.cursor()

        cursor.execute('''
            SELECT TransactionDate, Merchant, Amount, Category
            FROM transactions
            WHERE TransactionDate BETWEEN %s AND %s
        ''', (start_date, end_date))

        transactions = cursor.fetchall()
        print(transactions)
        return jsonify(transactions)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()


if __name__ == '__main__':
    app.run(host='localhost', port=8000, debug=True)