# PyForge Reference Notes: Foundations of Data Analysis

Data Analysis is the systematic process of cleaning, transforming, and modeling raw data to discover useful information, draw conclusions, and support decision-making. 

---

## 1. The Data Pipeline Lifecycle

Every analytics task follows a structured sequence of operations:
1. **Data Acquisition**: Fetching raw data from files (CSV, JSON), databases, or API responses.
2. **Data Cleaning & Preprocessing**: Correcting formatting, dropping duplicates, and handling missing observations.
3. **Exploratory Data Analysis (EDA)**: Calculating summary statistics to understand correlations and value spreads.
4. **Data Visualization**: Transforming numbers into graphical charts (bar charts, histograms, line graphs) to reveal trends.

---

## 2. Core Data Cleaning Techniques

Raw real-world datasets are notoriously noisy. Before modeling data, you must clean it:

### Handling Missing (Null) Values:
* **Deletion**: Drop records containing missing fields entirely (best if missingness is minimal, e.g., < 2% of records).
* **Imputation**: Replace missing fields with a calculated value, such as the dataset's **mean** or **median** to prevent shrinking sample sizes.

### Outlier Detection:
Outliers are extreme anomalies that skew averages. They are often identified using:
* **Standard Deviation method**: Values that fall further than 3 standard deviations from the mean.
* **Interquartile Range (IQR)**: Checking bounds relative to the 25th and 75th percentiles.

---

## 3. Statistical Summarization (First Principles)

To analyze any numeric series, we compute the following summary metrics:

### Mean (Arithmetic Average)
The sum of all values divided by the count.
$$\text{Mean} (\mu) = \frac{\sum_{i=1}^{n} x_i}{n}$$

### Median (Middle Value)
The middle value when the data is sorted in ascending order.
* If $n$ is odd: The value at index $\frac{n+1}{2}$.
* If $n$ is even: The average of values at indexes $\frac{n}{2}$ and $\frac{n}{2} + 1$.
* **Why it matters**: The median is highly robust against outliers.

### Variance & Standard Deviation
Measure the spread of data around the mean. Standard deviation is the square root of variance:
$$\text{Variance} (\sigma^2) = \frac{\sum (x_i - \mu)^2}{n}$$
$$\text{Standard Deviation} (\sigma) = \sqrt{\text{Variance}}$$
* A **low** standard deviation means data points are clustered closely to the average.
* A **high** standard deviation shows a wide variation in variables.
