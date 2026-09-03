export const getHealth = (_req, res) => {
  return res.status(200).json({
    success: true,
    message: 'HL² API is running',
  });
};
