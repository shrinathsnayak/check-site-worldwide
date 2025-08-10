import GoogleAnalyticsPackage from "./GoogleAnalytics";

const Metrics = () => {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      <GoogleAnalyticsPackage />
    </>
  );
};

export default Metrics;
