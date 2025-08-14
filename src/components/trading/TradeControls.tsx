"use client";
import React from 'react';
import { Trade } from '@/types/trading';
import { Check, X, MessageCircle, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TradeControlsProps {
  trade?: Trade;
  isCurrentUserInitiator: boolean;
  tradeBalance: number;
  onAcceptTrade: () => void;
  onDeclineTrade: () => void;
  onCounterPropose: () => void;
  onCancelTrade: () => void;
  isLoading?: boolean;
}

const TradeControls: React.FC<TradeControlsProps> = ({
  trade,
  isCurrentUserInitiator,
  tradeBalance,
  onAcceptTrade,
  onDeclineTrade,
  onCounterPropose,
  onCancelTrade,
  isLoading = false
}) => {
  const getTradeBalanceDisplay = () => {
    const absBalance = Math.abs(tradeBalance);
    if (absBalance < 1) {
      return { text: 'Trade is balanced', color: 'text-success-600' };
    }
    
    if (tradeBalance > 0) {
      return {
        text: `You receive $${absBalance.toFixed(2)} more value`,
        color: 'text-success-600'
      };
    } else {
      return {
        text: `You give $${absBalance.toFixed(2)} more value`,
        color: 'text-warning-600'
      };
    }
  };

  const balanceDisplay = getTradeBalanceDisplay();

  const canAcceptTrade = trade && trade.status === 'proposed' && !isCurrentUserInitiator;
  const canCounterPropose = trade && ['proposed', 'counter_proposed'].includes(trade.status);
  const canCancelTrade = trade && ['proposed', 'counter_proposed'].includes(trade.status);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Trade Balance</h3>
        <p className={`text-xl font-bold ${balanceDisplay.color}`}>
          {balanceDisplay.text}
        </p>
        {trade && (
          <p className="text-sm text-secondary-600 mt-1">
            Status: <span className="capitalize font-medium">{trade.status.replace('_', ' ')}</span>
          </p>
        )}
      </div>

      <div className="space-y-3">
        {canAcceptTrade && (
          <button
            onClick={onAcceptTrade}
            className="w-full flex items-center justify-center space-x-2 bg-success-600 text-white py-3 px-4 rounded-lg hover:bg-success-700 transition-colors"
          >
            <Check className="w-5 h-5" />
            <span>Accept Trade</span>
          </button>
        )}

        {canCounterPropose && (
          <button
            onClick={onCounterPropose}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Counter Propose</span>
          </button>
        )}

        <div className="flex space-x-3">
          {trade && trade.status !== 'declined' && (
            <button
              onClick={onDeclineTrade}
              className="flex-1 flex items-center justify-center space-x-2 bg-error-600 text-white py-3 px-4 rounded-lg hover:bg-error-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Decline</span>
            </button>
          )}

          {canCancelTrade && (
            <button
              onClick={onCancelTrade}
              className="flex-1 flex items-center justify-center space-x-2 bg-secondary-600 text-white py-3 px-4 rounded-lg hover:bg-secondary-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>

        <button className="w-full flex items-center justify-center space-x-2 border border-secondary-300 text-secondary-700 py-3 px-4 rounded-lg hover:bg-secondary-50 transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>Send Message</span>
        </button>
      </div>

      {trade && trade.messages.length > 0 && (
        <div className="mt-6 pt-6 border-t border-secondary-200">
          <h4 className="text-sm font-medium text-secondary-900 mb-3">Recent Messages</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {trade.messages.slice(-3).map((message) => (
              <div key={message.id} className="bg-secondary-50 rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-secondary-700">{message.userName}</span>
                  <span className="text-xs text-secondary-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-secondary-800">{message.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeControls;
