export type AiHealth = {
  status: 'ok';
  registeredActions: number;
};

export const getAiHealth = (registeredActions: number): AiHealth => ({
  status: 'ok',
  registeredActions,
});
